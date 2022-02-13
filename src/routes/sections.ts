import express from 'express'
import oracledb from 'oracledb'
import { closeConnection, extractTableAndId, getUniQuery, invalidForm, notAuthenticated, serverError, setLocals, unAuthorized } from '../reusableParts'
import randomString from 'randomstring';
import bcrypt from 'bcrypt'

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
        if(!body || !body.batchId || !body.departmentId || !body.sectionName || !body.studentCount || body.studentCount > 1000) return invalidForm(next, res);
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
        
        let result = await connection.execute<{r : {}}>(query, {
            bId : body.batchId,
            dId : body.departmentId,
            mId : ret.id,
            sName : body.sectionName,
            r : {dir : oracledb.BIND_OUT, type : "SECTION%ROWTYPE"}
        }, {autoCommit : true});
        if(!result.outBinds) return serverError(next, res);
        console.log(result);
        let content : any = [];
        for(let i = 1; i <= body.studentCount; ++i){
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
        let result2 = await connection.executeMany(query,content, {autoCommit : true});
        // console.log(result2);
        return res.status(200).json(result.outBinds.r);
        
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
