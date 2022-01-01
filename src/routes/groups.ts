import express from 'express'
import oracledb from 'oracledb'
import { closeConnection, extractTableAndId, notAuthenticated, serverError, unAuthorized } from '../reusableParts';

let router = express.Router()

router.route('/')
.get(async (req, res, next)=>{
    let ret = extractTableAndId(next, req, res);
    if(!ret) return;
    let connection;
    if(ret.tableName == 'Management'){
        return unAuthorized(next, res);
    }
    try{
        oracledb.fetchAsString = [oracledb.CLOB]
        connection = await oracledb.getConnection();
        let query;
        if(ret.tableName == 'Student'){
            let type = 'pg';
            let result = await connection.execute<{
                STYPE : string
            }>(
                `
                    SELECT BATCHOFSTYPE as STYPE FROM STUDENT JOIN BATCH USING(BATCH_ID) WHERE ROLE_ID = :id
                `,
                {id : ret.id},
                {outFormat : oracledb.OUT_FORMAT_OBJECT}
            );
            if(!result || !result.rows || result.rows.length == 0){
                return notAuthenticated(next, res);
            }
            type = result.rows[0].STYPE;
            console.log(type);
            query = 
            `
            WITH GROUPS as
                    (SELECT gs.name       as SECTION_GROUP_NAME,
                            gs.GROUP_ID   as SECTION_GROUP_ID,
                            gbd.name      as BATCH_DEPT_GROUP_NAME,
                            gbd.GROUP_ID  as BATCH_DEPT_GROUP_ID,
                            gb.name       as BATCH_GROUP_NAME,
                            gb.GROUP_ID   as BATCH_GROUP_ID,
                            gds.name      as DEPARTMENT_${type}_STUDENTS_GROUP_NAME,
                            gds.GROUP_ID  as DEPARTMENT_${type}_STUDENTS_GROUP_ID,
                            gdsa.name     as DEPARTMENT_ALL_STUDENTS_GROUP_NAME,
                            gdsa.GROUP_ID as DEPARTMENT_ALL_STUDENTS_GROUP_ID,

                            gdst.name     as DEPARTMENT_STUDENTS_TEACHERS_GROUP_NAME,
                            gdst.GROUP_ID as DEPARTMENT_STUDENTS_TEACHERS_GROUP_ID,

                            gus.name      as UNIVERSITY_${type}_STUDENTS_GROUP_NAME,
                            gus.GROUP_ID  as UNIVERSITY_${type}_STUDENTS_GROUP_ID,

                            gusa.name     as UNIVERSITY_ALL_STUDENTS_GROUP_NAME,
                            gusa.GROUP_ID as UNIVERSITY_ALL_STUDENTS_GROUP_ID,

                            gust.name     as UNIVERSITY_STUDENTS_TEACHERS_GROUP_NAME,
                            gust.GROUP_ID as UNIVERSITY_STUDENTS_TEACHERS_GROUP_ID

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
                    WHERE S.ROLE_ID = :id
                    )
            SELECT  P.*, G.*, C2.*
            FROM GROUPS G,
                (
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT * FROM POST P WHERE P.GROUP_ID = G.SECTION_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT * FROM POST P WHERE P.GROUP_ID = G.BATCH_DEPT_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT * FROM POST P WHERE P.GROUP_ID = G.BATCH_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT *
                                        FROM POST P
                                        WHERE P.GROUP_ID = G.DEPARTMENT_${type}_STUDENTS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT *
                                        FROM POST P
                                        WHERE P.GROUP_ID = G.DEPARTMENT_ALL_STUDENTS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT *
                                        FROM POST P
                                        WHERE P.GROUP_ID = G.DEPARTMENT_STUDENTS_TEACHERS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT *
                                        FROM POST P
                                        WHERE P.GROUP_ID = G.UNIVERSITY_${type}_STUDENTS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT *
                                        FROM POST P
                                        WHERE P.GROUP_ID = G.UNIVERSITY_ALL_STUDENTS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT *
                                        FROM POST P
                                        WHERE P.GROUP_ID = G.UNIVERSITY_STUDENTS_TEACHERS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                ) T

                    LEFT OUTER JOIN POST P ON P.CONTENT_ID = T.CONTENT_ID
                    LEFT JOIN CONTENT C2 on P.CONTENT_ID = C2.CONTENT_ID
            
            `
                
        }
        else{
            query = `
            WITH GROUPS AS (
                SELECT
                    dgt.GROUP_ID as DEPARTMENT_TEACHERS_GROUP_ID,
                    dga.GROUP_ID as DEPARTMENT_STUDENTS_TEACHERS_GROUP_ID,
                    uga.GROUP_ID as UNIVERSITY_STUDENTS_TEACHERS_GROUP_ID,
                    ugt.GROUP_ID as UNIVERSITY_TEACHERS_GROUP_ID,
                    dgt.GROUP_ID as DEPARTMENT_TEACHERS_GROUP_NAME,
                    dga.GROUP_ID as DEPARTMENT_STUDENTS_TEACHERS_GROUP_NAME,
                    uga.GROUP_ID as UNIVERSITY_STUDENTS_TEACHERS_GROUP_NAME,
                    ugt.GROUP_ID as UNIVERSITY_TEACHERS_GROUP_NAME
            
                FROM TEACHER T
                JOIN DEPARTMENT D on T.DEPARTMENT_ID = D.DEPARTMENT_ID
                JOIN UNIVERSITY U on D.UNIVERSITY_ID = U.UNIVERSITY_ID
                LEFT OUTER JOIN PGROUP dgt ON dgt.GROUP_ID = D.TEACHERS_GROUP_ID
                LEFT OUTER JOIN PGROUP dga On dga.GROUP_ID = D.ALL_GROUP_ID
                LEFT OUTER JOIN PGROUP ugt ON ugt.GROUP_ID = U.TEACHERS_GROUP_ID
                LEFT OUTER JOIN PGROUP uga ON uga.GROUP_ID = U.ALL_GROUP_ID
                WHERE T.ROLE_ID = :id
            )
            SELECT P.*, G.*, C2.*
            FROM GROUPS G, (
            
                     SELECT A.CONTENT_ID
                     FROM GROUPS G
                              OUTER APPLY(SELECT * FROM POST P WHERE P.GROUP_ID = G.DEPARTMENT_TEACHERS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                     UNION
                     SELECT A.CONTENT_ID
                     FROM GROUPS G
                              OUTER APPLY(SELECT * FROM POST P WHERE P.GROUP_ID = G.DEPARTMENT_STUDENTS_TEACHERS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                     UNION
            
                     SELECT A.CONTENT_ID
                     FROM GROUPS G
                              OUTER APPLY(SELECT * FROM POST P WHERE P.GROUP_ID = G.UNIVERSITY_TEACHERS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                     UNION
            
                     SELECT A.CONTENT_ID
                     FROM GROUPS G
                              OUTER APPLY(SELECT * FROM POST P WHERE P.GROUP_ID = G.UNIVERSITY_STUDENTS_TEACHERS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                ) T
            
                     LEFT OUTER JOIN POST P ON P.CONTENT_ID = T.CONTENT_ID
                     LEFT JOIN CONTENT C2 on P.CONTENT_ID = C2.CONTENT_ID

            `
        }
        let result = await connection.execute(
            query,
            {id : ret.id},
            {outFormat : oracledb.OUT_FORMAT_OBJECT}
        );
        if(!result || !result.rows || result.rows.length == 0){
            return serverError(next, res);
        }
        res.status(200).json(result.rows);
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