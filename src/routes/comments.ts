import express, {NextFunction, Response} from 'express'
import oracledb from 'oracledb'
import {closeConnection, extractTableAndId, invalidForm, notFound, serverError, unAuthorized} from '../reusableParts'

let router = express.Router()

async function checkIfInsideGroup(
    connection: oracledb.Connection,
    groupId: number,
    roleId: number,
    next: NextFunction,
    res: Response
): Promise<boolean> {
    try {
        connection = await oracledb.getConnection();
        let query = `SELECT COUNT(*)
                     FROM GROUP_MEMBER
                     WHERE GROUP_ID = :gId
                       AND ROLE_ID = :rId`;
        let result = await connection.execute(query, {gId: groupId, rId: roleId});
        if (!result.rows) return false;
        return result.rows.length !== 0;
    } catch (error) {
        serverError(next, res);
        return false;
    }
}


router.route('/:contentId')
    .get(async (req, res, next) => {

        let r = extractTableAndId(next, req, res);
        if (!r) return;
        if (r.tableName == 'Management') return unAuthorized(next, res);
        let contentId = parseInt(req.params.contentId);
        let connection;
        try {

            connection = await oracledb.getConnection();
            oracledb.fetchAsString = [oracledb.CLOB]

            let query = `

                SELECT REPLIES,
                       UPVOTE,
                       DOWNVOTE,
                       C.CONTENT_ID,
                       C.TEXT,
                       C.POSTED_AT,
                       C.ROLE_ID,
                       P2.FIRST_NAME || ' ' || p2.LAST_NAME as USERNAME,
                       G.GROUP_ID,
                       G.NAME                               as GROUP_NAME,
                       Voted.DOWN
                FROM (SELECT COM1.CONTENT_ID,
                             COUNT(DISTINCT COM2.CONTENT_ID) as REPLIES,
                             COUNT(DISTINCT V.ROLE_ID)       AS UPVOTE,
                             COUNT(DISTINCT V2.ROLE_ID)      as DOWNVOTE
                      FROM COMMENT_ COM1
                               JOIN CONTENT CON1 ON COM1.CONTENT_ID = CON1.CONTENT_ID
                               LEFT OUTER JOIN COMMENT_ COM2 ON COM2.COMMENT_OF = CON1.CONTENT_ID
                               LEFT OUTER JOIN VOTE V ON V.CONTENT_ID = COM1.CONTENT_ID AND V.DOWN = 'N'
                               LEFT OUTER JOIN VOTE V2 ON V2.CONTENT_ID = COM1.CONTENT_ID AND V2.DOWN != 'N'
                      WHERE COM1.COMMENT_OF = :cId
                      GROUP BY COM1.CONTENT_ID) CONTENT_IDS

                         JOIN CONTENT C ON C.CONTENT_ID = CONTENT_IDS.CONTENT_ID
                         JOIN COMMENT_ COMM ON COMM.CONTENT_ID = C.CONTENT_ID
                         JOIN PGROUP G ON G.GROUP_ID = C.GROUP_ID
                         JOIN ACADEMIC_ROLE AR on C.ROLE_ID = AR.ROLE_ID
                         JOIN PERSON P2 on AR.PERSON_ID = P2.PERSON_ID
                         LEFT OUTER JOIN VOTE VOTED ON VOTED.ROLE_ID = :rId AND VOTED.CONTENT_ID = C.CONTENT_ID

                        ORDER BY C.POSTED_AT DESC
            `
            let result = await connection.execute<{
                GROUP_ID: number
            }>(
                query,
                {
                    cId: contentId,
                    rId: r.id
                }, {
                    outFormat: oracledb.OUT_FORMAT_OBJECT,
                }
            )
            if (!result || !result.rows) return notFound(next, res);
            if (result.rows.length == 0) return res.status(200).json([]);
            let isAuthorized = await checkIfInsideGroup(connection, result.rows[0].GROUP_ID, r.id, next, res);
            if (isAuthorized) {
                return res.status(200).json(result.rows);
            } else {
                return unAuthorized(next, res);
            }
        } catch (error) {
            console.log(error);
            return serverError(next, res);
        } finally {
            await closeConnection(connection);
        }
    })

    .post(async (req, res, next) => {
        let ret = extractTableAndId(next, req, res);
        if (!ret) {
            return;
        }
        if (ret.tableName == 'Management') {
            return unAuthorized(next, res);
        }

        let body = req.body;
        if (!body || !body.text || (body.text.trim().length == 0) || !(parseInt(req.params.contentId) >= 0)) {
            return invalidForm(next, res);
        }

        let connection;
        try {
            connection = await oracledb.getConnection();
            let query = `
            BEGIN
                :ret := CREATE_COMMENT(:text, :roleId, :commentOf);
            END;
        `
            let result = await connection.execute<{
                ret: {}
            }>(
                query,
                {
                    text: req.body.text,
                    roleId: ret.id,
                    commentOf: req.params.contentId,
                    ret: {dir: oracledb.BIND_OUT, type: "COMMENT_%ROWTYPE"},
                },
                {
                    autoCommit: true
                }
            )
            if (!result.outBinds || !result.outBinds.ret) return serverError(next, res);
            return res.status(200).json(result.outBinds.ret);
        } catch (error) {
            console.log(error);
            serverError(next, res);
        } finally {
            await closeConnection(connection);
        }
    })


export default router;