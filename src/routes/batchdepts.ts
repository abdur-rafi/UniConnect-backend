import express from 'express'
import oracledb from 'oracledb'
import { closeConnection, extractTableAndId, getUniQuery, invalidForm, notAuthenticated, serverError, setLocals, unAuthorized } from '../reusableParts'

let router = express.Router()

router.route('/')
.post(async (req, res, next) =>{
    
    let ret = extractTableAndId(next, req, res);
    if(!ret) return;
    let connection;
    if(ret.tableName !== 'Management'){
        return unAuthorized(next, res);
    }
    try{
        connection = await oracledb.getConnection();
        let body = req.body;
        if(!body || !body.departmentId || !body.batchId){
            return invalidForm(next, res);
        }
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

                :r := CREATE_BATCH_DEPT(:bId, :dId); 
            END;
        ` 
        // console.log(body);
        
        let result = await connection.execute<{r : {}}>(query, {
            bId : body.batchId,
            dId : body.departmentId,
            mId : ret.id,
            r : {dir : oracledb.BIND_OUT, type : "BATCHDEPT%ROWTYPE"}
        }, {autoCommit : true});
        if(!result.outBinds) return serverError(next, res);
        // console.log(result);
        return res.status(200).json(result.outBinds.r);

        // let result
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
