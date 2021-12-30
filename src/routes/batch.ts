import { parse } from 'dotenv'
import express from 'express'
import oracledb from 'oracledb'
import { closeConnection, invalidForm, notAuthenticated, serverError, setLocals } from '../reusableParts'

let router = express.Router()

router.route('/')
.post(async (req, res, next)=>{
    let cookie = req.signedCookies;
    if(!cookie || !cookie.user || !cookie.user.managementId){
        return notAuthenticated(next, res);
    }
    let managementId = cookie.user.managementId;
    if(!req.body || !req.body.batchName || !req.body.year || !req.body.type){
        return invalidForm(next, res);
    }
    let name : string = req.body.batchName.trim();
    let year : string = req.body.year.trim();
    let type = req.body.type.trim();
    if(name.length < 3 || (type !== 'pg' && type !== 'ug') || year.length != 4 ){
        return invalidForm(next , res);
    }
    let connection;
    try{
        connection = await oracledb.getConnection();
        let query = 
        `
            BEGIN
                :ret := CREATE_BATCH(
                    :bName,
                    (SELECT UNIVERSITY_ID FROM MANAGEMENT WHERE MANAGEMENT_ID = :mId),
                    :year,
                    :sType
                );
            END;
        `
        connection.execute<{
            ret : {

            }
        }>(
            query,
            {
                bName : name,
                year : year,
                sType : type,
                ret : {dir : oracledb.BIND_OUT, type : "BATCH%ROWTYPE"}
            },
            {
                outFormat : oracledb.OUT_FORMAT_OBJECT
            },
            (err , result)=>{
                if(!result.rows || result.rows?.length == 0 || err){
                    if(err){
                        if(err.errorNum == 6502){
                            return setLocals(400, 'Invalid Date',next, res);
                        }
                        else if(err.message.includes('UNIQUEBATCHNAME')){
                            return setLocals(400, 'Batch Name Not Uniqu', next, res);
                        }
                        else if(err.message.includes('UNIQUEBATCHYEAR')){
                            return setLocals(400, `Batch at year ${year} already exists`, next, res);
                        }
                    }
                    return serverError(next, res);
                }
                else if(result.rows) {
                    res.status(200).json(result.rows[0].ret);
                }
            }
        )
    }
    catch(err){
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
    
})