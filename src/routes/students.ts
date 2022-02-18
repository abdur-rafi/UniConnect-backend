import express from 'express'
import oracledb from 'oracledb'
import {closeConnection, invalidCookie, notAuthenticated, noUserFound, serverError} from '../reusableParts'

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


export default router;