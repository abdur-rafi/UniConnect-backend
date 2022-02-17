import express, { NextFunction, Response } from 'express'
import oracledb from 'oracledb'
import { closeConnection, extractTableAndId, getUniQuery, invalidForm, notAuthenticated, notFound, serverError, setLocals, unAuthorized } from '../reusableParts'

let router = express.Router()



router.route('/delete/:contentId')
.post(async (req, res, next) =>{
    let ret = extractTableAndId(next, req, res);
    if(!ret){
        return ;
    }
    if(ret.tableName == 'Management'){
        return unAuthorized(next, res);
    }
    
    let connection;
    try{
        connection = await oracledb.getConnection();
        let query = `DELETE FROM CONTENT WHERE CONTENT_ID = :cId`;
        let result = await connection.execute(query, {
            cId : req.params.contentId
        }, {autoCommit : true});
        return res.status(200).json({message : "success"});
    }
    catch(error){
        console.log(error);
        serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }

})


export default router;