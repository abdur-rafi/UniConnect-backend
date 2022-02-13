import express from 'express'
import oracledb from 'oracledb'
import { closeConnection, extractTableAndId, getUniQuery, invalidForm, notAuthenticated, serverError, setLocals } from '../reusableParts'

let router = express.Router()

router.route('/')
.post(async (req, res, next)=>{
    let ret = extractTableAndId(next, req, res);
    if(!ret || ret.tableName !== 'Management') return notAuthenticated(next, res);
    let managementId = ret.id;
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
            DECLARE
                d number;
            BEGIN
                SELECT UNIVERSITY_ID INTO d FROM MANAGEMENT WHERE MANAGEMENT_ID = :mId;
                :ret := CREATE_BATCH(
                    :bName,
                    d,
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
                mId : managementId,
                ret : {dir : oracledb.BIND_OUT, type : "BATCH%ROWTYPE"}
            },
            {
                outFormat : oracledb.OUT_FORMAT_OBJECT,
                autoCommit : true
            },
            (err , result)=>{
                if(!result || !result.outBinds || err){
                    console.log(err);
                    if(err){
                        if(err.errorNum == 6502){
                            return setLocals(400, 'Invalid Date',next, res);
                        }
                        else if(err.message.includes('UNIQUEBATCHNAME')){
                            return setLocals(400, 'Batch Name Not Uniqu', next, res);
                        }
                        else if(err.message.includes('UNIQUEBATCHYEAR')){
                            return setLocals(400, `${type}-${year} already exists`, next, res);
                        }
                    }
                    return serverError(next, res);
                }
                else{
                    res.status(200).json(result.outBinds.ret);
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

.get(async (req, res, next)=>{
    // console.log("here");
    let ret = extractTableAndId(next, req, res);
    console.log(ret);
    if(!ret){
        return;
    }
    let connection;
    try{
        connection  = await oracledb.getConnection();
        let universityQuery = getUniQuery(ret.tableName);
        let query = `
            SELECT 
                B.BATCH_ID, 
                B.NAME as BATCH_NAME,
                B.YEAR as BATCH_YEAR,  
                D.NAME as DEPT_NAME, 
                COUNT(S.ROLE_ID) as STUDENT_COUNT,
                (
                    SELECT 
                        COUNT(SECTION_NAME) 
                    FROM 
                        SECTION SC 
                    WHERE 
                        SC.BATCH_ID = B.BATCH_ID 
                        AND 
                        SC.DEPARTMENT_ID = D.DEPARTMENT_ID
                ) as SECTION_COUNT
            FROM
                BATCH B
            LEFT OUTER JOIN
                BATCHDEPT BD
            ON
                B.BATCH_ID = BD.BATCH_ID
            LEFT OUTER JOIN
                DEPARTMENT D
            ON
                BD.DEPARTMENT_ID = D.DEPARTMENT_ID
            LEFT OUTER JOIN
                STUDENT S
            ON
                S.DEPARTMENT_ID = D.DEPARTMENT_ID AND S.BATCH_ID = B.BATCH_ID
            WHERE
                B.UNIVERSITY_ID = (${universityQuery})
            GROUP BY
                B.BATCH_ID, B.NAME, D.DEPARTMENT_ID, D.NAME, B.YEAR
            ORDER BY
                B.BATCH_ID
        `
        let result = await connection.execute(
            query,
            {id : ret.id},
            {outFormat : oracledb.OUT_FORMAT_OBJECT}
        )
        return res.status(200).json(result.rows)
    }
    catch(error){
        console.log(error);
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
})


router.route('/:batchId/')
.get(async (req, res, next) => {
    // console.log("here");
    let ret = extractTableAndId(next, req, res);
    console.log(ret);
    if (!ret) {
        return;
    }
    let connection;
    try {
        connection = await oracledb.getConnection();
        let universityQuery = getUniQuery(ret.tableName);
        let query = `
        SELECT 
            B.BATCH_ID, 
            B.NAME as BATCH_NAME,
            B.YEAR as BATCH_YEAR, 
            D.NAME as DEPT_NAME, 
            COUNT(S.ROLE_ID) as STUDENT_COUNT,
            (
                SELECT 
                    COUNT(SECTION_NAME) 
                FROM 
                    SECTION SC 
                WHERE 
                    SC.BATCH_ID = B.BATCH_ID 
                    AND 
                    SC.DEPARTMENT_ID = D.DEPARTMENT_ID
            ) as SECTION_COUNT
        FROM
            BATCH B
        LEFT OUTER JOIN
            BATCHDEPT BD
        ON
            B.BATCH_ID = BD.BATCH_ID
        LEFT OUTER JOIN
            DEPARTMENT D
        ON
            BD.DEPARTMENT_ID = D.DEPARTMENT_ID
        LEFT OUTER JOIN
            STUDENT S
        ON
            S.DEPARTMENT_ID = D.DEPARTMENT_ID AND S.BATCH_ID = B.BATCH_ID
        WHERE
            B.UNIVERSITY_ID = (${universityQuery}) AND B.BATCH_ID = ${req.params.batchId}
        GROUP BY
            B.BATCH_ID, B.YEAR, B.NAME, D.DEPARTMENT_ID, D.NAME
        ORDER BY
            B.BATCH_ID
    `
        let result = await connection.execute(
            query,
            {id: ret.id},
            {outFormat: oracledb.OUT_FORMAT_OBJECT}
        )
        return res.status(200).json(result.rows)
    } catch (error) {
        console.log(error);
        return serverError(next, res);
    } finally {
        await closeConnection(connection);
    }
})



export default router;