import express, { NextFunction , Response} from 'express'
import oracledb from 'oracledb'
import { closeConnection, extractTableAndId, invalidForm, notAuthenticated, notFound, serverError, setLocals, unAuthorized } from '../reusableParts';

let router = express.Router()

function selectAutoCreatedGroupsQuery(tableName : 'Teacher' | 'Student', type : string ) : string{
    if(tableName == 'Teacher'){
        return `
        SELECT
            dgt.GROUP_ID as DEPARTMENT_TEACHERS_GROUP_ID,
            dga.GROUP_ID as DEPARTMENT_STUDENTS_TEACHERS_GROUP_ID,
            uga.GROUP_ID as UNIVERSITY_STUDENTS_TEACHERS_GROUP_ID,
            ugt.GROUP_ID as UNIVERSITY_TEACHERS_GROUP_ID

        FROM TEACHER T
        JOIN DEPARTMENT D on T.DEPARTMENT_ID = D.DEPARTMENT_ID
        JOIN UNIVERSITY U on D.UNIVERSITY_ID = U.UNIVERSITY_ID
        LEFT OUTER JOIN PGROUP dgt ON dgt.GROUP_ID = D.TEACHERS_GROUP_ID
        LEFT OUTER JOIN PGROUP dga On dga.GROUP_ID = D.ALL_GROUP_ID
        LEFT OUTER JOIN PGROUP ugt ON ugt.GROUP_ID = U.TEACHERS_GROUP_ID
        LEFT OUTER JOIN PGROUP uga ON uga.GROUP_ID = U.ALL_GROUP_ID
        WHERE T.ROLE_ID = :id
        `
    }
    else{
        return `
        SELECT  
                gs.GROUP_ID   as SECTION_GROUP_ID,
                gbd.GROUP_ID  as BATCH_DEPT_GROUP_ID,
                gb.GROUP_ID   as BATCH_GROUP_ID,
                gds.GROUP_ID  as DEPARTMENT_${type}_STUDENTS_GROUP_ID,
                gdsa.GROUP_ID as DEPARTMENT_ALL_STUDENTS_GROUP_ID,
                gdst.GROUP_ID as DEPARTMENT_STUDENTS_TEACHERS_GROUP_ID,
                gus.GROUP_ID  as UNIVERSITY_${type}_STUDENTS_GROUP_ID,
                gusa.GROUP_ID as UNIVERSITY_ALL_STUDENTS_GROUP_ID,
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
                LEFT OUTER JOIN PGROUP gusa
                                ON gusa.group_id = U.students_group_id
                LEFT OUTER JOIN PGROUP gust
                                ON gust.group_id = U.all_group_id
                LEFT OUTER JOIN PGROUP gus
                                ON gus.group_id = U.${type}Students_group_id
        WHERE S.ROLE_ID = :id
`
    }
}

function selectStudentTypeQuery() : string{
    return `
        SELECT BATCHOFSTYPE as STYPE FROM STUDENT JOIN BATCH USING(BATCH_ID) WHERE ROLE_ID = :id
    `
}

async function checkIfInsideGroup(
    connection : oracledb.Connection, 
    groupId : number, 
    roleId : number, 
    role : 'Teacher' | 'Student',
    next : NextFunction, 
    res : Response
) : Promise<boolean>{
    try{
        connection = await oracledb.getConnection();
        let type : string = 'ug';
        
        if(role == 'Student'){
            let typeR = await connection.execute<{
                STYPE : string
            }>(
                selectStudentTypeQuery(),
                {
                    id : roleId
                },
                {
                    outFormat : oracledb.OUT_FORMAT_OBJECT
                }
            )
            if(!typeR.rows || typeR.rows.length == 0){
                serverError(next, res);
                return false;
            }
            type = typeR.rows[0].STYPE;    
            console.log(typeR);
        }
        console.log(type);
        
        let groups = await connection.execute<[number]>(
            selectAutoCreatedGroupsQuery(role, type),
            {id : roleId},
        )
        if(!groups.rows || groups.rows.length == 0){
            serverError(next, res);
            return false;
        }
        if(groups.rows[0].includes(groupId)) return true;
        let userCreatedQuery = `
            SELECT GROUP_ID FROM GROUP_MEMBER WHERE ROLE_ID = :id
        `
        let userCreatedGroups = await connection.execute<[number]>(
            userCreatedQuery,
            {
                id : roleId
            }
        );
        if(!userCreatedGroups.rows || userCreatedGroups.rows.length == 0){
            serverError(next, res);
            return false;
        }
        return userCreatedGroups.rows.some(r => r[0] == groupId)

        // console.log(groups);
    } catch(error){
        serverError(next, res);
        return false;
    }
    
}

router.route('/')
.get(async (req, res, next) =>{
    
    let ret = extractTableAndId(next, req, res);
    if(!ret) return;
    let connection;
    if(ret.tableName == 'Management'){
        return unAuthorized(next, res);
    }
    try{
        connection = await oracledb.getConnection();
        
    }
    catch(error){
        console.log(error);
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
})

router.route('/posts')
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
                selectStudentTypeQuery(),
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
                            LEFT OUTER JOIN PGROUP gusa
                                            ON gusa.group_id = U.students_group_id
                            LEFT OUTER JOIN PGROUP gust
                                            ON gust.group_id = U.all_group_id
                            LEFT OUTER JOIN PGROUP gus
                                            ON gus.group_id = U.${type}Students_group_id
                    WHERE S.ROLE_ID = :id
                    )
            SELECT  P.*, G.*, C2.*, P2.FIRST_NAME || ' ' || p2.LAST_NAME as USER_NAME
            FROM GROUPS G,
                (
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT P.CONTENT_ID FROM POST P JOIN CONTENT C ON C.CONTENT_ID = P.CONTENT_ID WHERE C.GROUP_ID = G.SECTION_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT P.CONTENT_ID FROM POST P JOIN CONTENT C ON C.CONTENT_ID = P.CONTENT_ID  WHERE C.GROUP_ID = G.BATCH_DEPT_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT P.CONTENT_ID FROM POST P JOIN CONTENT C ON C.CONTENT_ID = P.CONTENT_ID  WHERE C.GROUP_ID = G.BATCH_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT P.CONTENT_ID
                                        FROM POST P JOIN CONTENT C ON C.CONTENT_ID = P.CONTENT_ID
                                        WHERE C.GROUP_ID = G.DEPARTMENT_UG_STUDENTS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT P.CONTENT_ID
                                        FROM POST P JOIN CONTENT C ON C.CONTENT_ID = P.CONTENT_ID
                                        WHERE C.GROUP_ID = G.DEPARTMENT_ALL_STUDENTS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT P.CONTENT_ID
                                        FROM POST P JOIN CONTENT C ON C.CONTENT_ID = P.CONTENT_ID
                                        WHERE C.GROUP_ID = G.DEPARTMENT_STUDENTS_TEACHERS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT P.CONTENT_ID
                                        FROM POST P JOIN CONTENT C ON C.CONTENT_ID = P.CONTENT_ID
                                        WHERE C.GROUP_ID = G.UNIVERSITY_UG_STUDENTS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT P.CONTENT_ID
                                        FROM POST P JOIN CONTENT C ON C.CONTENT_ID = P.CONTENT_ID
                                        WHERE C.GROUP_ID = G.UNIVERSITY_ALL_STUDENTS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                    UNION
                    SELECT A.CONTENT_ID
                    FROM GROUPS G
                            OUTER APPLY(SELECT P.CONTENT_ID
                                        FROM POST P JOIN CONTENT C ON C.CONTENT_ID = P.CONTENT_ID
                                        WHERE C.GROUP_ID = G.UNIVERSITY_STUDENTS_TEACHERS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                ) T

                    LEFT OUTER JOIN POST P ON P.CONTENT_ID = T.CONTENT_ID
                    LEFT JOIN CONTENT C2 on P.CONTENT_ID = C2.CONTENT_ID
                    JOIN ACADEMIC_ROLE AR on C2.ROLE_ID = AR.ROLE_ID JOIN PERSON P2 on AR.PERSON_ID = P2.PERSON_ID

                    ORDER BY POSTED_AT
            
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
            SELECT P.*, G.*, C2.*, P2.FIRST_NAME || ' ' || p2.LAST_NAME as USER_NAME
            FROM GROUPS G, (
                        
                SELECT A.CONTENT_ID
                FROM GROUPS G
                         OUTER APPLY(SELECT P.CONTENT_ID FROM POST P JOIN CONTENT C ON C.CONTENT_ID = P.CONTENT_ID  WHERE C.GROUP_ID = G.DEPARTMENT_TEACHERS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                UNION
                SELECT A.CONTENT_ID
                FROM GROUPS G
                         OUTER APPLY(SELECT P.CONTENT_ID FROM POST P JOIN CONTENT C ON C.CONTENT_ID = P.CONTENT_ID WHERE C.GROUP_ID = G.DEPARTMENT_STUDENTS_TEACHERS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                UNION
       
                SELECT A.CONTENT_ID
                FROM GROUPS G
                         OUTER APPLY(SELECT P.CONTENT_ID FROM POST P JOIN CONTENT C ON C.CONTENT_ID = P.CONTENT_ID WHERE C.GROUP_ID = G.UNIVERSITY_TEACHERS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                UNION
       
                SELECT A.CONTENT_ID
                FROM GROUPS G
                         OUTER APPLY(SELECT P.CONTENT_ID FROM POST P JOIN CONTENT C ON C.CONTENT_ID = P.CONTENT_ID WHERE C.GROUP_ID = G.UNIVERSITY_STUDENTS_TEACHERS_GROUP_ID FETCH NEXT 5 ROWS ONLY) A
                ) T
            
                     LEFT OUTER JOIN POST P ON P.CONTENT_ID = T.CONTENT_ID
                     LEFT JOIN CONTENT C2 on P.CONTENT_ID = C2.CONTENT_ID
                     JOIN ACADEMIC_ROLE AR on C2.ROLE_ID = AR.ROLE_ID JOIN PERSON P2 on AR.PERSON_ID = P2.PERSON_ID

                     ORDER BY POSTED_AT

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
router.route('/posts/:groupId')
.post(async (req, res, next)=>{

    let ret = extractTableAndId(next, req, res);
    if(!ret){
        return ;
    }
    if(ret.tableName == 'Management'){
        return unAuthorized(next, res);
    }
    if(!req.body || !req.body.title || !req.body.text){
        return invalidForm(next, res);
    }
    let title : string = req.body.title.trim();
    let text : string = req.body.text.trim();
    if(title.length == 0 || text.length  == 0 ){
        return invalidForm(next, res);
    }

    let connection;
    try{
        connection = await oracledb.getConnection();
        let groupId = parseInt(req.params.groupId);
        if(!(groupId > 0)){
            return setLocals(400, 'invalid group id', next, res);
        }
        let r = await checkIfInsideGroup(connection, groupId, ret.id, ret.tableName, next, res);
        if(r){
            oracledb.fetchAsString = [oracledb.CLOB]
            
            let postQuery = 
            `
                BEGIN
                    :ret := CREATE_POST(
                        :text,
                        :roleId,
                        :title,
                        :groupId
                    );
                END;
            `;
            let result = await connection.execute<{
                ret : {
                    CONTENT_ID : number,
                    TITLE : any,
                    TEXT : any
                }
            }>(
                postQuery,
                {
                    text : text,
                    roleId : ret.id,
                    title : title,
                    groupId : groupId,
                    ret : {dir : oracledb.BIND_OUT, type : "POST%ROWTYPE"},
                    
                },
                {
                    autoCommit : true
                }
            )    
            if(!result || !result.outBinds){
                return serverError(next, res);
            }
            let query = 
            `
                SELECT * FROM POST JOIN CONTENT USING (CONTENT_ID) WHERE CONTENT_ID = :cId
            `
            let result2 = await connection.execute<{}>(query,{
                cId : result.outBinds.ret.CONTENT_ID
            }, {outFormat : oracledb.OUT_FORMAT_OBJECT})
            if(!result2 || !result2.rows || result2.rows.length == 0){
                return serverError(next, res);
            }
            return res.status(200).json(result2.rows);
            
        }
        else{
            return unAuthorized(next, res);
        }


    }
    catch(error){
        console.log(error);
        serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
    
})
router.route('/posts/:groupId/:from/:direction/:count/:order')
.get(async (req, res, next) =>{

    
    let ret = extractTableAndId(next, req, res);
    if(!ret){
        return ;
    }
    if(ret.tableName == 'Management'){
        return unAuthorized(next, res);
    }
    let errorMessage;
    if(req.params.order !== 'asc' && req.params.order !== 'desc'){
        errorMessage = 'invalid order parameter'
    }
    else if(req.params.direction !== 'after' && req.params.direction !== 'before'){
        errorMessage = 'invalid direction parameter'
    }
    if(errorMessage){
        return setLocals(400, errorMessage, next, res);
    }    
    let connection;
    
    try{

        connection = await oracledb.getConnection();
        let groupId = parseInt(req.params.groupId);
        if(!(groupId > 0)){
            return setLocals(400, 'invalid group id', next, res);
        }
        let count = parseInt(req.params.count);
        if(!(count > 0)){
            return setLocals(400, 'invalid count', next , res);
        }
        let from = parseInt(req.params.from);
        if(!(from > 0)){
            return setLocals(400, 'invalid from parameter', next, res);
        }
        
        let r = await checkIfInsideGroup(connection, groupId, ret.id, ret.tableName, next, res);
        if(r){
            oracledb.fetchAsString = [oracledb.CLOB]
            
            let query = 
            `
                SELECT P.*, PE.FIRST_NAME || ' ' || PE.LAST_NAME as USER_NAME, G.NAME as GROUP_NAME
                FROM POST P
                JOIN CONTENT C
                ON C.CONTENT_ID = P.CONTENT_ID
                JOIN PGROUP G ON C.GROUP_ID = G.GROUP_ID
                JOIN ACADEMIC_ROLE AR ON AR.ROLE_ID = C.ROLE_ID
                JOIN PERSON PE ON PE.PERSON_ID = AR.PERSON_ID
                WHERE C.GROUP_ID = :gId  
                AND C.CONTENT_ID ${req.params.direction === 'after' ? '>' : '<'} :cId
                ORDER BY posted_at ${req.params.order} FETCH NEXT :count ROW ONLY
            `
            let result = await connection.execute<{}>(
                query,
                {
                    gId : groupId,
                    count : count,
                    cId : from
                },{
                    outFormat : oracledb.OUT_FORMAT_OBJECT
                }
            )

            if(!result || !result.rows){
                return serverError(next, res);
            }
            return res.status(200).json(result.rows);
        }
        else{
            return unAuthorized(next, res);
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

router.route('/posts/:contentId')
.get(async (req, res, next) =>{

    let r = extractTableAndId(next, req, res);
    if(!r) return ;
    if(r.tableName == 'Management') return unAuthorized(next, res);
    let contentId = parseInt(req.params.contentId);
    let connection;
    // console.log(contentId)
    try{
        connection = await oracledb.getConnection();
        oracledb.fetchAsString = [oracledb.CLOB]

        let query = `
            SELECT * FROM CONTENT JOIN POST USING(CONTENT_ID) WHERE CONTENT_ID = :cId
        `
        let result = await connection.execute<{
            GROUP_ID : number
        }>(
            query,
            {
                cId : contentId
            },{
                outFormat : oracledb.OUT_FORMAT_OBJECT
            }
        )
        if(!result || !result.rows || result.rows.length == 0 ) return notFound(next, res);
        let isAuthorized = await checkIfInsideGroup(connection, result.rows[0].GROUP_ID,r.id, r.tableName, next, res);
        if(isAuthorized){
            return res.status(200).json(result.rows);
        }
        else{
            return unAuthorized(next, res);
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

router.route('/comments/:contentId')
.get(async (req, res, next) =>{
    
    let r = extractTableAndId(next, req, res);
    if(!r) return ;
    if(r.tableName == 'Management') return unAuthorized(next, res);
    let contentId = parseInt(req.params.contentId);
    let connection;
    try{
        connection = await oracledb.getConnection();
        oracledb.fetchAsString = [oracledb.CLOB]

        let query = `
            SELECT * FROM COMMENT_ JOIN CONTENT USING(CONTENT_ID) WHERE COMMENT_OF = :cId
        `
        let result = await connection.execute<{
            GROUP_ID : number
        }>(
            query,
            {
                cId : contentId
            },{
                outFormat : oracledb.OUT_FORMAT_OBJECT
            }
        )
        if(!result || !result.rows ) return notFound(next, res);
        if(result.rows.length == 0) return res.status(200).json([]);
        let isAuthorized = await checkIfInsideGroup(connection, result.rows[0].GROUP_ID,r.id, r.tableName, next, res);
        if(isAuthorized){
            return res.status(200).json(result.rows);
        }
        else{
            return unAuthorized(next, res);
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

export default router;