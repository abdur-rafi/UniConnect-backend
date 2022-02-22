import express from 'express'
import oracledb from 'oracledb'
import {closeConnection, extractTableAndId, serverError, setLocals, unAuthorized} from '../reusableParts';

let router = express.Router()


// get info of custom


router.route('/custom')
    .get(async (req, res, next) => {
        let ret = extractTableAndId(next, req, res);
        if (!ret) return;
        let connection;
        if (ret.tableName == 'Management') {
            return unAuthorized(next, res);
        }
        try {
            connection = await oracledb.getConnection();
            let query = `
                SELECT G.GROUP_ID,
                       G.NAME,
                       COUNT(DISTINCT GM2.ROLE_ID)  as GROUP_MEMBERS_COUNT,
                       GM1.MEMBER_ROLE,
                       COUNT(DISTINCT P.CONTENT_ID) as GROUP_POSTS_COUNT
                FROM GROUP_MEMBER GM1
                         JOIN PGROUP G on GM1.GROUP_ID = G.GROUP_ID
                         JOIN GROUP_MEMBER GM2 ON GM2.GROUP_ID = G.GROUP_ID
                         LEFT OUTER JOIN CONTENT C2 on G.GROUP_ID = C2.GROUP_ID
                         LEFT OUTER JOIN POST P on C2.CONTENT_ID = P.CONTENT_ID
                WHERE GM1.ROLE_ID = :id
                  AND G.USER_CREATED = 'Y'
                GROUP BY GM1.ROLE_ID, G.GROUP_ID, G.NAME, GM1.MEMBER_ROLE
            `;
            let result = await connection.execute(query, {
                id: ret.id
            }, {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            });
            if (!result.rows) return serverError(next, res);
            return res.status(200).json(result.rows);
        } catch (error) {
            console.log(error);
            return serverError(next, res);
        } finally {
            await closeConnection(connection);
        }
    })

    // create a custom group
    .post(async (req, res, next) => {

        let ret = extractTableAndId(next, req, res);
        if (!ret) return;
        let connection;
        if (ret.tableName == 'Management') {
            return unAuthorized(next, res);
        }
        try {
            connection = await oracledb.getConnection();
            let body = req.body;
            let groupName: string = body.groupName;
            if (!groupName || groupName.length < 3) {
                return setLocals(400, 'group name should be longer', next, res);
            }

            let query = `
        DECLARE 
        t PGROUP%ROWTYPE;
        BEGIN
            t := CREATE_GROUP(:groupName, 'Y');
            INSERT INTO GROUP_MEMBER(GROUP_ID, ROLE_ID, MEMBER_ROLE) 
            VALUES (t.GROUP_ID,:roleId, :mRole);
            :gr := t;
        end;
        `
            let result = await connection.execute<{
                gr: {}
            }>(query, {
                    roleId: ret.id,
                    mRole: 'adm',
                    groupName: groupName,
                    gr: {dir: oracledb.BIND_OUT, type: "PGROUP%ROWTYPE"},
                },
                {
                    outFormat: oracledb.OUT_FORMAT_OBJECT,
                    autoCommit: true
                });
            if (!result.outBinds || !result.outBinds.gr) {
                return serverError(next, res);
            }
            return res.status(200).json(result.outBinds.gr);
        } catch (error) {
            console.log(error);
            return serverError(next, res);
        } finally {
            await closeConnection(connection);
        }
    })


// get Info of default groups
router.route('/defaults')
    .get(async (req, res, next) => {

        let ret = extractTableAndId(next, req, res);
        if (!ret) return;
        let connection;
        if (ret.tableName == 'Management') {
            return unAuthorized(next, res);
        }
        try {
            connection = await oracledb.getConnection();
            let query = `

                SELECT G.GROUP_ID,
                       G.NAME,
                       COUNT(DISTINCT GM2.ROLE_ID)  as GROUP_MEMBERS_COUNT,
                       GM1.MEMBER_ROLE,
                       COUNT(DISTINCT P.CONTENT_ID) as GROUP_POSTS_COUNT
                FROM GROUP_MEMBER GM1
                         JOIN PGROUP G on GM1.GROUP_ID = G.GROUP_ID
                         JOIN GROUP_MEMBER GM2 ON GM2.GROUP_ID = G.GROUP_ID
                         LEFT OUTER JOIN CONTENT C2 on G.GROUP_ID = C2.GROUP_ID
                         LEFT OUTER JOIN POST P on C2.CONTENT_ID = P.CONTENT_ID
                WHERE GM1.ROLE_ID = :id
                  AND G.USER_CREATED = 'N'
                GROUP BY GM1.ROLE_ID, G.GROUP_ID, G.NAME, GM1.MEMBER_ROLE
            `


            let result = await connection.execute(
                query,
                {id: ret.id},
                {outFormat: oracledb.OUT_FORMAT_OBJECT}
            );
            if (!result || !result.rows || result.rows.length == 0) {
                return serverError(next, res);
            }
            res.status(200).json(result.rows);


        } catch (error) {
            console.log(error);
            return serverError(next, res);
        } finally {
            await closeConnection(connection);
        }
    })


export default router;