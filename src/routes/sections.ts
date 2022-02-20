import express from 'express'
import oracledb from 'oracledb'
import {closeConnection, extractTableAndId, getUniQuery, invalidForm, serverError, unAuthorized} from '../reusableParts'
import randomString from 'randomstring';
import bcrypt from 'bcrypt'

let router = express.Router()

router.route('/')
    .post(async (req, res, next) => {

        let ret = extractTableAndId(next, req, res);
        if (!ret) return;
        let connection;
        if (ret.tableName !== 'Management') {
            return unAuthorized(next, res);
        }

        try {
            connection = await oracledb.getConnection();
            let body = req.body;
            if (!body || !body.batchId || !body.departmentId || !body.sectionName || !body.studentCount || body.studentCount > 1000) return invalidForm(next, res);
            let query = `
            DECLARE
                mUniId number;
                bUniId number;
            BEGIN
                SELECT UNIVERSITY_ID INTO mUniId FROM MANAGEMENT WHERE MANAGEMENT_ID = :mId;
                SELECT UNIVERSITY_ID INTO bUniId FROM BATCH WHERE BATCH_ID = :bId;

                IF mUniId != bUniId THEN
                    RAISE_APPLICATION_ERROR(-20002, 'Unauthorized');
                END IF;

                :r := CREATE_SECTION(:bId, :dId, :sName);
            END;
        `

            let result = await connection.execute<{ r: {} }>(query, {
                bId: body.batchId,
                dId: body.departmentId,
                mId: ret.id,
                sName: body.sectionName,
                r: {dir: oracledb.BIND_OUT, type: "SECTION%ROWTYPE"}
            }, {autoCommit: true});
            if (!result.outBinds) return serverError(next, res);
            console.log(result);
            let content: any = [];
            for (let i = 1; i <= body.studentCount; ++i) {
                let randPass = randomString.generate(9);
                let salt = await bcrypt.genSalt()
                let hash = await bcrypt.hash(randPass, salt)

                content.push([null, body.batchId, body.departmentId, randPass, hash, body.sectionName, i]);
            }
            query = `
            DECLARE
                r STUDENT%ROWTYPE;
            BEGIN
                r := CREATE_STUDENT(:1, :2, :3, :4, :5, :6, :7);
            END;
        `
            await connection.executeMany(query, content, {autoCommit: true});
            return res.status(200).json(result.outBinds.r);

        } catch (error) {
            console.log(error);
            return serverError(next, res);
        } finally {
            await closeConnection(connection);
        }
    })


router.route('/:deptId/:batchId')
    .get(async (req, res, next) => {

        let ret = extractTableAndId(next, req, res);
        if (!ret) return;

        let connection;

        try {
            connection = await oracledb.getConnection();
            let query = `

                SELECT S.SECTION_NAME, COUNT(DISTINCT SC.ROLE_ID) as STUDENT_COUNT
                FROM SECTION S
                         JOIN DEPARTMENT D on S.DEPARTMENT_ID = D.DEPARTMENT_ID
                         LEFT OUTER JOIN STUDENT SC
                                         ON SC.SECTION_NAME = S.SECTION_NAME AND SC.DEPARTMENT_ID = S.DEPARTMENT_ID AND
                                            SC.BATCH_ID = S.BATCH_ID
                WHERE S.DEPARTMENT_ID = :dId
                  AND S.BATCH_ID = :bId
                  AND D.UNIVERSITY_ID = (${getUniQuery(ret.tableName)})
                GROUP BY S.SECTION_NAME
                ORDER BY S.SECTION_NAME
            `
            let result = await connection.execute(query, {
                id: ret.id,
                dId: req.params.deptId,
                bId: req.params.batchId
            }, {outFormat: oracledb.OUT_FORMAT_OBJECT});
            console.log(result.rows)
            res.status(200).json(result.rows)

        } catch (error) {
            console.log(error);
            return serverError(next, res);
        } finally {
            await closeConnection(connection);
        }
    })

export default router;
