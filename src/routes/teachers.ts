import express from 'express'
import oracledb from 'oracledb'
import randomString from 'randomstring';

import { closeConnection, extractTableAndId, getUniQuery, invalidCookie, invalidForm, notAuthenticated, noUserFound, serverError, setLocals, unAuthorized } from '../reusableParts'

let router = express.Router();



router.route('/create/')
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
        if(!body) return invalidForm(next, res);
        if(!body.rank || !body.departmentId) return invalidForm(next, res);
        
        let query = `
        
        DECLARE
            d Number;
        BEGIN
            SELECT COUNT(*) INTO d FROM DEPARTMENT WHERE DEPARTMENT_ID = :dId AND 
            UNIVERSITY_ID = (SELECT UNIVERSITY_ID FROM MANAGEMENT WHERE MANAGEMENT_ID = :mId);
            IF d = 0 THEN
                RAISE_APPLICATION_ERROR(-20999,'Unauthorized');
            end if;
            :r := CREATE_TEACHER(null, :pass , :rank, :dId);
        end; 
        `
        let result = await connection.execute<{
            r : { 

            }
        }>(query, {
            dId : req.body.departmentId,
            mId : ret.id,
            pass : randomString.generate(9),
            rank : body.rank,
            r : {dir : oracledb.BIND_OUT, type : "TEACHER%ROWTYPE"},
        }, {autoCommit : true});

        // console.log(result);
        if(!result.outBinds) return serverError(next, res);
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


router.route('/login/:id')
.post(async (req, res, next)=>{
    
    let cookie = req.signedCookies;
    if(!cookie || !cookie.user){
        return notAuthenticated(next, res); 
    }
    // console.log(cookie);
    let personId = cookie.user.personId;
    if(!personId){
        return invalidCookie(next, res);
    }
    let connection;
    try{
        connection = await oracledb.getConnection();
        let query = `
            SELECT 
                T.ROLE_ID AS ID 
            FROM 
                TEACHER T
            JOIN
                ACADEMIC_ROLE AR
            ON
                AR.ROLE_ID = T.ROLE_ID
            WHERE
                AR.PERSON_ID = :pId  AND T.ROLE_ID = :tId
            `   
        let result = await connection.execute<{
            ID : number
        }>(
            query,
            {pId : personId, tId : req.params.id},
            {outFormat : oracledb.OUT_FORMAT_OBJECT}
        )
        if( !result.rows || result.rows.length == 0){
            return noUserFound(next, res);
        }
        res.cookie('user', {
            personId : personId,
            teacherId : result.rows[0].ID
        }, {
            signed : true
        })
        return res.status(200).json({
            personId : personId,
            teacherId : result.rows[0].ID
        })
    }
    catch(error){
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);

    }
})



router.route('/details/:deptId/:after/:notClaimed')
.get(async (req, res, next) =>{
    
    let ret = extractTableAndId(next, req, res);
    
    if(!ret) return;
    let connection;
    try{
        connection = await oracledb.getConnection();
        let query = `
        SELECT P.FIRST_NAME || ' ' || p.LAST_NAME as FULL_NAME, T.ROLE_ID, T.RANK, P.EMAIL
        ${ret.tableName === 'Management' ? ',AR.TOKEN' : ''}
        FROM TEACHER T JOIN ACADEMIC_ROLE AR ON AR.ROLE_ID = T.ROLE_ID
        LEFT OUTER JOIN PERSON P 
        on  AR.PERSON_ID = P.PERSON_ID
        LEFT OUTER JOIN DEPARTMENT D on T.DEPARTMENT_ID = D.DEPARTMENT_ID
        WHERE D.UNIVERSITY_ID = (${getUniQuery(ret.tableName)}) AND D.DEPARTMENT_ID = :dId AND T.ROLE_ID > :after
        ${req.params.notClaimed == 'false' ?'' : ' AND AR.PERSON_ID IS NULL '}
        ORDER BY T.ROLE_ID FETCH NEXT 30 ROWS ONLY
        `;
        let result = await connection.execute(query, {
            dId : req.params.deptId,
            id : ret.id,
            after : req.params.after
        }, {outFormat : oracledb.OUT_FORMAT_OBJECT});
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

router.route('/search/:deptId/:name')
.get(async (req, res, next)=>{
    
    let ret = extractTableAndId(next, req, res);
    if(!req.params.name || req.params.name.trim().length < 3){
        return res.status(400).json({message : "name length should be higher"});
    }
    if(!ret) return;
    let connection;
    try{
        connection = await oracledb.getConnection();
        let query = `
        SELECT P.FIRST_NAME || ' ' || p.LAST_NAME as FULL_NAME, T.ROLE_ID, T.RANK, P.EMAIL
        ${ret.tableName === 'Management' ? ',AR.TOKEN' : ''}
        FROM TEACHER T JOIN ACADEMIC_ROLE AR ON AR.ROLE_ID = T.ROLE_ID
        LEFT OUTER JOIN PERSON P 
        on  AR.PERSON_ID = P.PERSON_ID
        LEFT OUTER JOIN DEPARTMENT D on T.DEPARTMENT_ID = D.DEPARTMENT_ID
        WHERE D.UNIVERSITY_ID = (${getUniQuery(ret.tableName)}) AND 
        D.DEPARTMENT_ID = :dId AND 
        LOWER(P.FIRST_NAME || ' ' || p.LAST_NAME) LIKE LOWER(:s) FETCH NEXT 30 ROWS ONLY
        `;
        let result = await connection.execute(query, {
            dId : req.params.deptId,
            id : ret.id,
            s : `%${req.params.name}%`
        }, {outFormat : oracledb.OUT_FORMAT_OBJECT});
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