import express from 'express'
import oracledb from 'oracledb'
import bcrypt from 'bcrypt'

import {closeConnection, invalidForm, notAuthenticated, noUserFound, serverError, unAuthorized} from '../reusableParts'

let router = express.Router();


router.route('/claim/:roleId')
    .post(async (req, res, next) => {

        let cookie = req.signedCookies;
        if (!cookie || !cookie.user) {
            notAuthenticated(next, res);
            return null;
        }
        let user = cookie.user;
        if (!user.personId) {
            return notAuthenticated(next, res);
        }


        let personId = user.personId;

        let connection;
        try {
            connection = await oracledb.getConnection();
            let body = req.body;
            if (!body || !body.password) return invalidForm(next, res);
            let query = `
                SELECT *
                FROM ACADEMIC_ROLE
                WHERE ROLE_ID = :rId
            `
            if (!(parseInt(req.params.roleId) > 0)) {
                return res.status(400).json({message: "invalid request id parameter"});
            }

            let result = await connection.execute<{
                ROLE_ID: number,
                PASSWORD: string
            }>(query, {
                rId: req.params.roleId
            }, {outFormat: oracledb.OUT_FORMAT_OBJECT});

            if (!result.rows || result.rows.length == 0) return noUserFound(next, res);

            let same = await bcrypt.compare(body.password, result.rows[0].PASSWORD);
            if (same) {
                query = `
                    UPDATE ACADEMIC_ROLE
                    SET PERSON_ID = :pId
                    WHERE ROLE_ID = :rId
                `
                await connection.execute(query, {
                    pId: personId,
                    rId: req.params.roleId
                }, {autoCommit: true});
                res.cookie('user', {
                    personId: personId,
                    teacherId: parseInt(req.params.roleId)
                }, {
                    signed: true
                });
                return res.status(200).json({message: "role claimed successfully"});

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


export default router;