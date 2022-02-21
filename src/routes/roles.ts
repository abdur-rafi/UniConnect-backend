import express from 'express'
import oracledb from 'oracledb'
import bcrypt from 'bcrypt'

import { closeConnection, extractTableAndId, getUniQuery, invalidCookie, invalidForm, notAuthenticated, noUserFound, serverError, setLocals, unAuthorized } from '../reusableParts'

let router = express.Router();


router.route('/claim/:roleId')
.post(async (req, res, next) =>{
    
    let cookie = req.signedCookies;
    if(!cookie || !cookie.user){
        notAuthenticated(next, res);
        return null;
    }
    let user = cookie.user;
    if(!user.personId){
        return notAuthenticated(next, res);
    }
    

    let personId = user.personId;

    let connection;
    try{
        connection = await oracledb.getConnection();
        let body = req.body;
        if(!body || !body.token) return invalidForm(next, res);
        let query = `
            SELECT * FROM ACADEMIC_ROLE WHERE ROLE_ID = :rId AND TOKEN =: token AND PERSON_ID IS NULL
        `
        if(!(parseInt(req.params.roleId) > 0)){
            return res.status(400).json({message : "invalid request id parameter"});
        }

        let result = await connection.execute<{
            ROLE_ID : number
        }>(query, {
            rId : req.params.roleId,
            token : req.body.token
        }, {outFormat : oracledb.OUT_FORMAT_OBJECT});
        console.log(result);
        if(!result.rows || result.rows.length == 0) return unAuthorized(next, res);

        query = `
            UPDATE ACADEMIC_ROLE SET PERSON_ID = :pId WHERE ROLE_ID = :rId
        `
        let result2 = await connection.execute(query, {
            pId : personId,
            rId : req.params.roleId
        }, {autoCommit : true});
        res.cookie('user', {
            personId : personId,
            teacherId : parseInt(req.params.roleId)
        }, {
            signed : true
        });
        return res.status(200).json({message : "role claimed successfully"});
    
    }
    catch(error){
        console.log(error);
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
})



export default router;