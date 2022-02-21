import express from 'express'
import oracledb from 'oracledb'
import {
    closeConnection,
    extractTableAndId,
    getUniQuery,
    invalidCookie,
    invalidForm,
    notAuthenticated,
    noUserFound,
    serverError
} from '../reusableParts'

let router = express.Router();

router.route('/login/:id')
    .post(async (req, res, next) => {
        let cookie = req.signedCookies;
        if (!cookie || !cookie.user) {
            return notAuthenticated(next, res);
        }

        let personId = cookie.user.personId;
        if (!personId) {
            return invalidCookie(next, res);
        }

        let connection;
        try {
            connection = await oracledb.getConnection();
            let query = `
                SELECT S.ROLE_ID AS ID
                FROM STUDENT S
                         JOIN
                     ACADEMIC_ROLE AR
                     ON
                         AR.ROLE_ID = S.ROLE_ID
                WHERE AR.PERSON_ID = :pId
                  AND S.ROLE_ID = :sId
            `

            let result = await connection.execute<{
                ID: number
            }>(
                query,
                {pId: personId, sId: req.params.id},
                {outFormat: oracledb.OUT_FORMAT_OBJECT}
            )
            if (!result.rows || result.rows.length == 0) {
                return noUserFound(next, res);
            }
            res.cookie('user', {
                personId: personId,
                studentId: result.rows[0].ID
            }, {
                signed: true
            })

            return res.status(200).json({
                personId: personId,
                studentId: result.rows[0].ID
            })
        } catch (error) {
            console.log(error);
            return serverError(next, res);
        } finally {
            await closeConnection(connection);
        }
    })

router.route('/:deptId/:batchId/:after/:name')
    .post(async (req, res, next) => {

        let ret = extractTableAndId(next, req, res);
        if (!ret) return;
        if (!req.body || !req.body.sectionNames) return invalidForm(next, res);

        let connection;

        try {
            connection = await oracledb.getConnection();
            let sectionNames: string[] = req.body.sectionNames;
            console.log(sectionNames);
            let notClaimedOnly = req.body.notClaimedOnly.toString() == 'true';
            console.log(req.body);
            console.log(notClaimedOnly);
            let query = `
                SELECT S.ROLE_ID,
                       P.FIRST_NAME || ' ' || p.LAST_NAME as FULL_NAME,
                       P.EMAIL,
                       S.SECTION_NAME,
                       S.SECTION_ROLL_NO
                                                             ${ret.tableName === 'Management' ? ',AR.TOKEN' : ''}
                FROM STUDENT S
                         JOIN DEPARTMENT D on S.DEPARTMENT_ID = D.DEPARTMENT_ID
                         JOIN ACADEMIC_ROLE AR on S.ROLE_ID = AR.ROLE_ID
                         LEFT OUTER JOIN PERSON P on AR.PERSON_ID = P.PERSON_ID
                WHERE S.DEPARTMENT_ID = :0 AND 
        S.BATCH_ID = :1 AND 
        D.UNIVERSITY_ID = (${getUniQuery(ret.tableName, 2)})
                  AND
                    S.ROLE_ID
                    > :3
                  AND ${notClaimedOnly ? ' AR.PERSON_ID IS NULL ' : `LOWER(P.FIRST_NAME || ' ' || p.LAST_NAME) LIKE LOWER(:4)`}
                  AND
                    S.SECTION_NAME IN (${sectionNames.map((name, index) => `:${index + (notClaimedOnly ? 4 : 5)}`).join(", ")})

                ORDER BY S.ROLE_ID FETCH NEXT 30 ROWS ONLY
            `
            let paramArr = [req.params.deptId, req.params.batchId, ret.id, req.params.after, `${req.body.useName ? (`%${req.params.name}%`) : '%'}`, ...sectionNames];
            if (notClaimedOnly) {
                paramArr = [req.params.deptId, req.params.batchId, ret.id, req.params.after, ...sectionNames];
            }
            let result = await connection.execute(query,
                paramArr
                , {outFormat: oracledb.OUT_FORMAT_OBJECT});

            res.status(200).json(result.rows);

        } catch (error) {
            console.log(error);
            return serverError(next, res);
        } finally {
            await closeConnection(connection);
        }
    })


export default router;