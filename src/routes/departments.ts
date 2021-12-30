import express from 'express'
import oracledb from 'oracledb'
import { closeConnection, invalidForm, notAuthenticated, serverError, setLocals } from '../reusableParts'

let router = express.Router()

router.route('/')
.post(async (req, res, next)=>{

    if(!req.signedCookies || !req.signedCookies.user || !req.signedCookies.user.managementId){
        return notAuthenticated(next, res);
    }
    let managementId = req.signedCookies.user.managementId;

    let body = req.body;

    if(!body || !body.deptName || !body.deptCode){
        return invalidForm(next, res);
    }
    
    let query = 
    `
        BEGIN
            :ret := CREATE_DEPARTMENT(
                (SELECT university_id FROM MANAGEMENT WHERE management_id = :mId),
                :deptName,
                :deptCode
            );
        END;
    `
    let connection;
    try{
        connection = await oracledb.getConnection();
        connection.execute<{
            ret : {
                
            }
        }>(
            query,
            {
                mId : managementId,
                deptName : req.body.deptName.trim(),
                deptCode : req.body.deptCode.trim(),
                ret : {dir : oracledb.BIND_OUT,type : "DEPARTMENT%ROWTYPE"}
            },
            {
                outFormat : oracledb.OUT_FORMAT_OBJECT,
                autoCommit : true
            },
            (err, result)=>{
                if(err){
                    if(err.errorNum == 1){
                        if(err.message.includes('UNIQUEDEPTCODE')){
                            return setLocals(403,'Dept Code already used',next, res);
                        }
                        else if(err.message.includes('UNIQUENAME')){
                            return setLocals(403,'Dept Name already used',next, res);
                        }
                        else{
                            return serverError(next, res);
                        }
                    }
                    else
                        return serverError(next, res);
                }
                else{
                    if(!result.outBinds || !result.outBinds.ret ){
                        return serverError(next, res);
                    }
                    else{
                        res.status(200).json(result.outBinds.ret);
                    }
                }
            }
        )
    }
    catch(error){
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }

      

})

router.route('/deptcodes')
.get(async (req, res, next)=>{
    let cookie = req.signedCookies;
    if(!cookie || !cookie.user || !cookie.user.managementId){
        return notAuthenticated(next, res);
    }
    let managementId = cookie.user.managementId;
    console.log(managementId);
    let connection;
    try{
        connection = await oracledb.getConnection();
        let query = `
            SELECT
                DEPT_CODE
            FROM
                DEPARTMENT
            WHERE 
                UNIVERSITY_ID = (SELECT UNIVERSITY_ID FROM MANAGEMENT WHERE MANAGEMENT_ID = :mId )
        `
        let result = await connection.execute(
            query,
            {mId : managementId},
            // {outFormat : oracledb.OUT_FORMAT_OBJECT}
        )
        console.log(result);
        res.status(200).json({deptCodes : result.rows});
    }
    catch(err){
        console.log(err);
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
})

export default router;