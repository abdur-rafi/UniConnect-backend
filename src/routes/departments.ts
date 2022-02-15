import express from 'express'
import oracledb from 'oracledb'
import { closeConnection, extractTableAndId, getUniQuery, invalidForm, notAuthenticated, serverError, setLocals, unAuthorized } from '../reusableParts'

let router = express.Router()

router.route('/')
.post(async (req, res, next)=>{

    let ret = extractTableAndId(next, req, res);
    if(!ret || ret.tableName !== 'Management') return unAuthorized(next, res); 
    let body = req.body;
    if(!body || !body.deptName || !body.deptCode){
        return invalidForm(next, res);
    }
    
    let query = 
    `
        DECLARE
            d number;
        BEGIN
            SELECT UNIVERSITY_ID INTO d FROM MANAGEMENT WHERE management_id = :mId;
            :ret := CREATE_DEPARTMENT(
                d,
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
                mId : ret.id,
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
                    console.log(err);
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

.get(async (req, res, next)=>{
    let ret = extractTableAndId(next, req, res);
    if(!ret) return null;
    let connection;
    try{
        connection = await oracledb.getConnection();
        let uniQuery = getUniQuery(ret?.tableName);

        let query = `
            SELECT 
                D.DEPARTMENT_ID,
                D.NAME as NAME,
                B.NAME as BATCH_NAME,
                B.YEAR,
                B.BATCH_ID,
                D.DEPT_CODE,
                B.BATCH_TYPE,
                (
                    SELECT 
                        COUNT(SECTION_NAME) 
                    FROM 
                        SECTION SC 
                    WHERE 
                        SC.BATCH_ID = B.BATCH_ID 
                        AND 
                        SC.DEPARTMENT_ID = D.DEPARTMENT_ID
                ) as SECTION_COUNT,
                COUNT(S.ROLE_ID) as STUDENT_COUNT
            FROM 
                DEPARTMENT D
            LEFT OUTER JOIN
                BATCHDEPT BD
            ON
                BD.DEPARTMENT_ID = D.DEPARTMENT_ID
            LEFT OUTER JOIN
                BATCH B
            ON
                BD.BATCH_ID = B.BATCH_ID
            LEFT OUTER JOIN
                STUDENT S
            ON 
                S.DEPARTMENT_ID = BD.DEPARTMENT_ID AND S.BATCH_ID = B.BATCH_ID
            WHERE
                D.UNIVERSITY_ID = (${uniQuery})
            GROUP BY
                    D.DEPARTMENT_ID,D.DEPT_CODE, D.NAME, B.YEAR, B.BATCH_ID, B.BATCH_TYPE, B.NAME
            ORDER BY
                D.DEPT_CODE, B.BATCH_TYPE, B.YEAR
        `

        query = `
        
            SELECT 
                D.DEPARTMENT_ID , D.NAME, 
                (SELECT COUNT(*) FROM BATCHDEPT WHERE DEPARTMENT_ID = D.DEPARTMENT_ID) as BATCH_COUNT,
                (SELECT COUNT(*) FROM SECTION WHERE DEPARTMENT_ID = D.DEPARTMENT_ID) as SECTION_COUNT,
                (SELECT COUNT(*) FROM STUDENT WHERE DEPARTMENT_ID = D.DEPARTMENT_ID) as STUDENT_COUNT,
                (SELECT COUNT(*) FROM TEACHER WHERE DEPARTMENT_ID = D.DEPARTMENT_ID) as TEACHER_COUNT,
                BD.BATCH_ID, B.NAME AS BATCH_NAME,B.YEAR,D.DEPT_CODE,
                COUNT(*) AS BATCH_STUDENTS_COUNT

            FROM 
                DEPARTMENT D
            FULL OUTER JOIN
                BATCHDEPT BD
            ON
                BD.DEPARTMENT_ID = D.DEPARTMENT_ID
            FULL OUTER JOIN
                BATCH B
            ON
                BD.BATCH_ID = B.BATCH_ID
            FULL OUTER JOIN
                STUDENT S
            ON
                S.BATCH_ID = B.BATCH_ID AND S.DEPARTMENT_ID = D.DEPARTMENT_ID 
            WHERE
                D.UNIVERSITY_ID = (${getUniQuery(ret.tableName)})
            GROUP BY
                D.DEPARTMENT_ID, D.NAME, D.DEPT_CODE, BD.BATCH_ID, B.YEAR, B.NAME
            ORDER BY
                D.DEPT_CODE, B.YEAR
        `

        let result = await connection.execute(
            query,
            {id : ret.id},
            {outFormat : oracledb.OUT_FORMAT_OBJECT}
        )
        return res.status(200).json(result.rows);

    } catch(error){
        console.log(error);
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