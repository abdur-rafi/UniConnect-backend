import express from 'express'
import oracledb from 'oracledb'
import { closeConnection, extractTableAndId, notAuthenticated, serverError } from '../reusableParts';

let router = express.Router()

router.route('/')
.get(async (req, res, next)=>{
    let ret = extractTableAndId(next, req, res);
    if(!ret) return;
    let connection;
    try{
        connection = await oracledb.getConnection();
        let query;
        if(ret.tableName == 'Student'){
            let type = 'pg';
            let result = await connection.execute<{
                STYPE : string
            }>(
                `
                    SELECT BATCHOFSTYPE as STYPE FROM STUDENT JOIN BATCH USING(BATCH_ID) WHERE STUDNET_ID = :id
                `,
                {id : ret.id},
                {outFormat : oracledb.OUT_FORMAT_OBJECT}
            );
            if(!result || !result.rows || result.rows.length == 0){
                return notAuthenticated(next, res);
            }
            type = result.rows[0].STYPE;
            query = `
                SELECT S.STUDENT_ID,
                section_name,
                department_id,
                D.university_id,
                D.NAME,
                gs.name as SECTION_GROUP,
                gbd.name as BATCH_DEPT_GROUP,
                gb.name as BATCH_GROUP,
                gds.name as DEPARTMENT_${type}_STUDENTS_GROUP,
                gdsa.name as DEPARTMENT_ALL_STUDENTS_GROUP,
                gdst.name as DEPARTMENT_STUDENTS_TEACHERS_GROUP,
                gus.name as UNIVERSITY_${type}_STUDENTS_GROUP,
                gusa.name as UNIVERSITY_ALL_STUDENTS_GROUP,
                gust.name as UNIVERSITY_STUDENTS_TEACHERS_GROUP
    
                FROM STUDENT S
                LEFT OUTER JOIN
                Section SC
                USING (batch_id, department_id, section_name)
                LEFT OUTER JOIN BATCHDEPT BD
                USING (BATCH_ID, DEPARTMENT_ID)
                LEFT OUTER JOIN
                DEPARTMENT D
                USING (DEPARTMENT_ID)
                LEFT OUTER JOIN
                UNIVERSITY U
                ON
                D.UNIVERSITY_ID = U.UNIVERSITY_ID
                LEFT OUTER JOIN BATCH B
                                USING (BATCH_ID)
                LEFT OUTER JOIN PGROUP gS
                ON gS.GROUP_ID = SC.GROUP_ID
                LEFT OUTER JOIN PGROUP gbd
                ON
                    gbd.GROUP_ID = BD.GROUP_ID
                LEFT OUTER JOIN PGROUP gb
                ON gb.group_id = B.GROUP_ID
                LEFT OUTER JOIN PGROUP gds
                ON gds.group_id = D.${type}Students_group_id
                LEFT OUTER JOIN PGROUP gdsa
                ON gdsa.group_id = D.STUDENTS_GROUP_ID
                LEFT OUTER JOIN PGROUP gdst
                ON gdst.group_id = D.all_group_id
                LEFT OUTER JOIN PGROUP gus
                ON gus.group_id = U.students_group_id
                LEFT OUTER JOIN PGROUP gust
                ON gust.group_id = U.all_group_id
                LEFT OUTER JOIN PGROUP gusa
                ON gusa.group_id = U.${type}Students_group_id
                WHERE S.STUDENT_ID = :id;
            `
        }
        else if(ret.tableName == 'Teacher'){
            
        }
    }
    catch(error){
        console.log(error);
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
    
})