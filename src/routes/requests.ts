import express from 'express'
import oracledb from 'oracledb'
import {closeConnection, extractTableAndId, invalidForm, serverError, unAuthorized} from '../reusableParts'

let router = express.Router();

// add members to custom group
router.route('/:groupId')
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
            if (!body || !body.newMembers || body.newMembers.length == 0) {
                return invalidForm(next, res);
            }
            let members: [number] = body.newMembers;
            let groupId = parseInt(req.params.groupId);
            if (!(groupId >= 0)) {
                return invalidForm(next, res);
            }

            let query = `
                INSERT INTO JOIN_GROUP_REQUEST(GROUP_ID, REQUEST_FROM, REQUEST_TO)
                SELECT :a, :b, :c
                FROM DUAL
                WHERE NOT EXISTS((SELECT GROUP_ID FROM GROUP_MEMBER WHERE GROUP_ID = :a AND ROLE_ID = :c)
                                 UNION
                                 (SELECT GROUP_ID FROM PGROUP WHERE GROUP_ID = :a AND USER_CREATED = 'N'))
            `

            let content: any = []
            members.forEach(m => {
                content.push([groupId, ret!.id, m])
            });

            await connection.executeMany(query, content, {autoCommit: true});
            return res.status(200).json({message: "success"});
        } catch (error) {
            console.log(error);
            return serverError(next, res);
        } finally {
            await closeConnection(connection);
        }
    })


router.route('/')
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
                SELECT R.REQUEST_TO,
                       R.REQUEST_ID,
                       G.GROUP_ID,
                       G.NAME                             as GROUP_NAME,
                       REQ_FROM.ROLE_ID,
                       P.FIRST_NAME || ' ' || P.LAST_NAME as REQUEST_FROM_USER_NAME,
                       DS.NAME                            AS STUDENT_DEPARTMENT_NAME,
                       US.NAME                            as STUDENT_UNIVERSITY_NAME,
                       DT.NAME                            AS TEACHER_DEPARTMENT_NAME,
                       UT.NAME                            as TEACHER_UNIVERSITY_NAME

                FROM JOIN_GROUP_REQUEST R
                         JOIN PGROUP G ON G.GROUP_ID = R.GROUP_ID
                         JOIN ACADEMIC_ROLE REQ_FROM on R.REQUEST_FROM = REQ_FROM.ROLE_ID
                         JOIN PERSON P ON P.PERSON_ID = REQ_FROM.PERSON_ID
                         LEFT OUTER JOIN STUDENT S ON S.ROLE_ID = REQ_FROM.ROLE_ID
                         LEFT OUTER JOIN TEACHER T on REQ_FROM.ROLE_ID = T.ROLE_ID
                         LEFT OUTER JOIN DEPARTMENT DS ON DS.DEPARTMENT_ID = S.DEPARTMENT_ID
                         LEFT OUTER JOIN DEPARTMENT DT ON DT.DEPARTMENT_ID = T.DEPARTMENT_ID
                         LEFT OUTER JOIN UNIVERSITY US ON US.UNIVERSITY_ID = DS.UNIVERSITY_ID
                         LEFT OUTER JOIN UNIVERSITY UT ON UT.UNIVERSITY_ID = DT.UNIVERSITY_ID
                WHERE R.REQUEST_TO = :rId
            `;

            let result = await connection.execute(query, {
                rId: ret.id
            }, {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
                autoCommit: true
            });

            return res.status(200).json(result.rows);
        } catch (error) {
            console.log(error);
            return serverError(next, res);
        } finally {
            await closeConnection(connection);
        }
    })


router.route('/:requestId/:accept')
    .post(async (req, res, next) => {

        let ret = extractTableAndId(next, req, res);
        if (!ret) return;
        let connection;
        if (ret.tableName == 'Management') {
            return unAuthorized(next, res);
        }
        if (req.params.accept !== 'yes' && req.params.accept !== 'no') return invalidForm(next, res);
        try {
            connection = await oracledb.getConnection();
            let query: string;
            if (req.params.accept === 'yes') {
                query = `
           
            BEGIN
                INSERT INTO GROUP_MEMBER(GROUP_ID, ROLE_ID, MEMBER_ROLE)
                SELECT GROUP_ID, REQUEST_TO, 'mem' FROM JOIN_GROUP_REQUEST WHERE REQUEST_ID = :reqId AND REQUEST_TO = :roleId;
                DELETE FROM JOIN_GROUP_REQUEST WHERE GROUP_ID = (SELECT GROUP_ID FROM JOIN_GROUP_REQUEST WHERE REQUEST_TO = :roleId AND REQUEST_ID = :reqId)
                AND
                REQUEST_TO = (SELECT REQUEST_TO FROM JOIN_GROUP_REQUEST WHERE REQUEST_TO = :roleId AND REQUEST_ID = :reqId);
            END;`

            } else {
                query = `
                    DELETE
                    FROM JOIN_GROUP_REQUEST
                    WHERE REQUEST_ID = :reqId
                      AND REQUEST_TO = :roleId
                `
            }

            let result = await connection.execute(query, {
                reqId: req.params.requestId,
                roleId: ret.id
            }, {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
                autoCommit: true
            });

            return res.status(200).json(result.rows);
        } catch (error) {
            console.log(error);
            return serverError(next, res);
        } finally {
            await closeConnection(connection);
        }
    })

export default router; 