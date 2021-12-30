import express from 'express'
import oracledb from 'oracledb'
import { closeConnection, serverError } from '../reusableParts';

let router = express.Router()



router.route('/:id/depts/')
.get(async (req, res, next)=>{
    let connection;
    try{
        connection = await oracledb.getConnection();
        let query = 
        `
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
                D.UNIVERSITY_ID = :uniId
            GROUP BY
                D.DEPARTMENT_ID, D.NAME, D.DEPT_CODE, BD.BATCH_ID, B.YEAR, B.NAME
            ORDER BY
                D.DEPT_CODE, B.YEAR
            
        `
        let result = await connection.execute<{
            DEPARTMENT_ID : number,
            NAME : string,
            BATCH_COUNT : number,
            SECTION_COUNT : number,
            STUDENT_COUNT : number,
            TEACHER_COUNT : number,
            BATCH_ID : number,
            BATCH_NAME : string,
            YEAR : number,
            DEPT_CODE : string,
            BATCH_STUDENTS_COUNT : number
        }>(
            query,
            {uniId : req.params.id},
            {outFormat : oracledb.OUT_FORMAT_OBJECT}
        )

        
        // console.log(req.signedCookies.user);
        res.status(200).json(result.rows);
        // console.log(result);
    }
    catch(err){
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
    
})

export default router;