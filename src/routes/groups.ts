import e, { text } from 'express';
import express, { NextFunction , Response} from 'express'
import oracledb from 'oracledb'
import { closeConnection, extractTableAndId, invalidForm, notAuthenticated, notFound, serverError, setLocals, unAuthorized } from '../reusableParts';

let router = express.Router()


async function checkIfInsideGroup(
    connection : oracledb.Connection, 
    groupId : number, 
    roleId : number, 
    next : NextFunction, 
    res : Response
) : Promise<boolean>{
    try{
        connection = await oracledb.getConnection();
        let query = `SELECT COUNT(*) FROM GROUP_MEMBER WHERE GROUP_ID = :gId AND ROLE_ID = :rId`;
        let result = await connection.execute(query, {gId : groupId, rId : roleId});
        if(!result.rows) return false;
        return result.rows.length !== 0;
        // console.log(groups);
    } catch(error){
        serverError(next, res);
        return false;
    }
    
}

// ger posts of  groups
router.route('/all/posts')
.get(async (req, res, next) =>{
    let ret = extractTableAndId(next, req, res);
    if(!ret) return;
    let connection;
    if(ret.tableName == 'Management'){
        return unAuthorized(next, res);
    }
    try{
        oracledb.fetchAsString = [oracledb.CLOB]

        connection = await oracledb.getConnection();
        let query = `
                        
            SELECT C.CONTENT_ID, C.TEXT,P.TITLE, C.POSTED_AT, G.GROUP_ID, G.NAME as GROUP_NAME,
            COMMENT_COUNT, UPVOTE_COUNT, DOWNVOTE_COUNT, P2.FIRST_NAME || ' ' || p2.LAST_NAME as POSTED_BY
            FROM
            (
            SELECT C.CONTENT_ID, COUNT(UNIQUE CMT.CONTENT_ID) as COMMENT_COUNT,
                COUNT(UNIQUE VU.ROLE_ID) as UPVOTE_COUNT,
                COUNT(UNIQUE  VD.ROLE_ID) as DOWNVOTE_COUNT
            FROM GROUP_MEMBER GM
            JOIN PGROUP G on GM.GROUP_ID = G.GROUP_ID
            JOIN CONTENT C ON C.GROUP_ID = G.GROUP_ID
            JOIN POST P ON P.CONTENT_ID = C.CONTENT_ID
            LEFT OUTER JOIN COMMENT_ CMT ON CMT.COMMENT_OF = P.CONTENT_ID
            LEFT OUTER JOIN VOTE VU ON VU.CONTENT_ID = C.CONTENT_ID AND VU.DOWN = 'N'
            LEFT OUTER JOIN VOTE VD ON VD.CONTENT_ID = C.CONTENT_ID AND VD.DOWN = 'Y'

            WHERE GM.ROLE_ID = :rId
            GROUP BY C.CONTENT_ID
            FETCH NEXT 25 ROW ONLY
            ) CONTENT_IDS
            JOIN CONTENT C ON C.CONTENT_ID = CONTENT_IDS.CONTENT_ID
            JOIN POST P ON P.CONTENT_ID = C.CONTENT_ID
            JOIN PGROUP G ON G.GROUP_ID = C.GROUP_ID
            JOIN ACADEMIC_ROLE AR on C.ROLE_ID = AR.ROLE_ID
            JOIN PERSON P2 on AR.PERSON_ID = P2.PERSON_ID
            ORDER BY C.POSTED_AT
        `
        

        let result = await connection.execute(
            query,
            {rId : ret.id},
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


// get info of custom 
router.route('/custom')
.get(async (req, res, next) =>{
    let ret = extractTableAndId(next, req, res);
    if(!ret) return;
    let connection;
    if(ret.tableName == 'Management'){
        return unAuthorized(next, res);
    }
    try{
        connection = await oracledb.getConnection();
        let query = `
            SELECT G.GROUP_ID, G.NAME, COUNT(GM2.ROLE_ID) as GROUP_MEMBERS_COUNT,GM1.MEMBER_ROLE,
            COUNT(P.CONTENT_ID) as GROUP_POSTS_COUNT
            FROM GROUP_MEMBER GM1
            JOIN PGROUP G on GM1.GROUP_ID = G.GROUP_ID
            JOIN GROUP_MEMBER GM2 ON GM2.GROUP_ID = G.GROUP_ID
            LEFT OUTER JOIN CONTENT C2 on G.GROUP_ID = C2.GROUP_ID
            LEFT OUTER JOIN POST P on C2.CONTENT_ID = P.CONTENT_ID
            WHERE GM1.ROLE_ID = :id AND G.USER_CREATED = 'Y'
            GROUP BY GM1.ROLE_ID, G.GROUP_ID, G.NAME, GM1.MEMBER_ROLE
        `;
        let result = await connection.execute(query, {
            id : ret.id
        }, {
            outFormat : oracledb.OUT_FORMAT_OBJECT
        });
        if(!result.rows) return serverError(next, res);
        return res.status(200).json(result.rows);
    }
    catch(error){
        console.log(error);
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
})

// create a custom groups
.post(async (req, res , next) =>{
    
    let ret = extractTableAndId(next, req, res);
    if(!ret) return;
    let connection;
    if(ret.tableName == 'Management'){
        return unAuthorized(next, res);
    }
    try{
        connection = await oracledb.getConnection();
        let body = req.body;
        let groupName : string = body.groupName;
        if(!groupName || groupName.length < 3){
            return setLocals(400, 'group name should be longer', next, res);
        }
        let query = `
        DECLARE 
        t PGROUP%ROWTYPE;
        BEGIN
            t := CREATE_GROUP(:groupName, 'Y');
            INSERT INTO GROUP_MEMBER(GROUP_ID, ROLE_ID, MEMBER_ROLE) 
            VALUES (t.GROUP_ID,:roleId, :mRole);
            :gr := t;
        end;
        `
        let result = await connection.execute<{
            gr : {}
        }>(query,{
            roleId : ret.id,
            mRole : 'adm',
            groupName : groupName,
            gr : {dir : oracledb.BIND_OUT, type : "PGROUP%ROWTYPE"},
        },
        {
            outFormat : oracledb.OUT_FORMAT_OBJECT,
            autoCommit : true
        });
        if(!result.outBinds || !result.outBinds.gr ){
            return serverError(next, res);
        }
        return res.status(200).json(result.outBinds.gr);
    }
    catch(error){
        console.log(error);
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
})


// add members to custom group
router.route('/custom/:groupId/add')
.post(async (req, res, next) =>{
    let ret = extractTableAndId(next, req, res);
    if(!ret) return;
    let connection;
    if(ret.tableName == 'Management'){
        return unAuthorized(next, res);
    }
    try{
        connection = await oracledb.getConnection();
        let body = req.body;
        if(!body || !body.newMembers || body.newMembers.length == 0){
            // console.log("here")
            return invalidForm(next, res);
        }
        let members : [number] = body.newMembers;
        let groupId = parseInt(req.params.groupId);
        if(!(groupId >= 0)){
            // console.log("here")
            return invalidForm(next, res);
        }
        let query = `
            INSERT INTO GROUP_MEMBER(GROUP_ID, ROLE_ID, MEMBER_ROLE) VALUES(:1, :2, :3)
        `
        let content : any = []
        members.forEach(m => {
            content.push([groupId, m , 'mem'])
        });
        let result = await connection.executeMany(query, content, {autoCommit : true});
        return res.status(200).json({});
    }
    catch(error){
        console.log(error);
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
})

// get Info of default groups
router.route('/defaults')
.get(async (req, res, next) =>{
    
    let ret = extractTableAndId(next, req, res);
    if(!ret) return;
    let connection;
    if(ret.tableName == 'Management'){
        return unAuthorized(next, res);
    }
    try{
        connection = await oracledb.getConnection();
        let query = `
                
            SELECT G.GROUP_ID, G.NAME, COUNT(GM2.ROLE_ID) as GROUP_MEMBERS_COUNT,GM1.MEMBER_ROLE,
            COUNT(P.CONTENT_ID) as GROUP_POSTS_COUNT
            FROM GROUP_MEMBER GM1
            JOIN PGROUP G on GM1.GROUP_ID = G.GROUP_ID
            JOIN GROUP_MEMBER GM2 ON GM2.GROUP_ID = G.GROUP_ID
            LEFT OUTER JOIN CONTENT C2 on G.GROUP_ID = C2.GROUP_ID
            LEFT OUTER JOIN POST P on C2.CONTENT_ID = P.CONTENT_ID
            WHERE GM1.ROLE_ID = :id AND G.USER_CREATED = 'N'
            GROUP BY GM1.ROLE_ID, G.GROUP_ID, G.NAME, GM1.MEMBER_ROLE
        `
        

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


// get posts of a groups with constraints
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
        
        oracledb.fetchAsString = [oracledb.CLOB]
        
        
        let query = `
        
            SELECT C.CONTENT_ID, C.TEXT,P.TITLE, C.POSTED_AT, G.GROUP_ID, G.NAME as GROUP_NAME,
            COMMENT_COUNT, UPVOTE_COUNT, DOWNVOTE_COUNT, P2.FIRST_NAME || ' ' || p2.LAST_NAME as POSTED_BY
            FROM
            (
            SELECT C.CONTENT_ID, COUNT(UNIQUE CMT.CONTENT_ID) as COMMENT_COUNT,
                COUNT(UNIQUE VU.ROLE_ID) as UPVOTE_COUNT,
                COUNT(UNIQUE  VD.ROLE_ID) as DOWNVOTE_COUNT
            FROM GROUP_MEMBER GM
            JOIN PGROUP G on GM.GROUP_ID = G.GROUP_ID
            JOIN CONTENT C ON C.GROUP_ID = G.GROUP_ID
            JOIN POST P ON P.CONTENT_ID = C.CONTENT_ID
            LEFT OUTER JOIN COMMENT_ CMT ON CMT.COMMENT_OF = P.CONTENT_ID
            LEFT OUTER JOIN VOTE VU ON VU.CONTENT_ID = C.CONTENT_ID AND VU.DOWN = 'N'
            LEFT OUTER JOIN VOTE VD ON VD.CONTENT_ID = C.CONTENT_ID AND VD.DOWN = 'Y'

            WHERE GM.ROLE_ID = :rId AND GM.GROUP_ID = :gId AND
            C.CONTENT_ID ${req.params.direction === 'after' ? '>' : '<'} :cId
            GROUP BY C.CONTENT_ID
            FETCH NEXT :count ROW ONLY
            ) CONTENT_IDS
            JOIN CONTENT C ON C.CONTENT_ID = CONTENT_IDS.CONTENT_ID
            JOIN POST P ON P.CONTENT_ID = C.CONTENT_ID
            JOIN PGROUP G ON G.GROUP_ID = C.GROUP_ID
            JOIN ACADEMIC_ROLE AR on C.ROLE_ID = AR.ROLE_ID
            JOIN PERSON P2 on AR.PERSON_ID = P2.PERSON_ID
            ORDER BY C.POSTED_AT
        `

        let result = await connection.execute<{}>(
            query,
            {
                rId : ret.id,
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
    catch(error){
        console.log(error);
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
})

// get a post
router.route('/post/:contentId')
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
                SELECT C.CONTENT_ID, C.TEXT,P.TITLE, C.POSTED_AT, G.GROUP_ID, G.NAME as GROUP_NAME,
                COMMENT_COUNT, UPVOTE_COUNT, DOWNVOTE_COUNT, P2.FIRST_NAME || ' ' || p2.LAST_NAME as POSTED_BY
                FROM
                (
                SELECT C.CONTENT_ID, COUNT(UNIQUE CMT.CONTENT_ID) as COMMENT_COUNT,
                    COUNT(UNIQUE VU.ROLE_ID) as UPVOTE_COUNT,
                    COUNT(UNIQUE  VD.ROLE_ID) as DOWNVOTE_COUNT
                    FROM
                    CONTENT C
                JOIN POST P ON P.CONTENT_ID = C.CONTENT_ID
                LEFT OUTER JOIN COMMENT_ CMT ON CMT.COMMENT_OF = P.CONTENT_ID
                LEFT OUTER JOIN VOTE VU ON VU.CONTENT_ID = C.CONTENT_ID AND VU.DOWN = 'N'
                LEFT OUTER JOIN VOTE VD ON VD.CONTENT_ID = C.CONTENT_ID AND VD.DOWN = 'Y'
                WHERE C.CONTENT_ID = :cId AND EXISTS(SELECT * FROM GROUP_MEMBER GM WHERE GM.ROLE_ID = :rId AND GM.GROUP_ID = C.GROUP_ID )
                GROUP BY C.CONTENT_ID
                ) CONTENT_IDS
                JOIN CONTENT C ON C.CONTENT_ID = CONTENT_IDS.CONTENT_ID
                JOIN POST P ON P.CONTENT_ID = C.CONTENT_ID
                JOIN PGROUP G ON G.GROUP_ID = C.GROUP_ID
                JOIN ACADEMIC_ROLE AR on C.ROLE_ID = AR.ROLE_ID
                JOIN PERSON P2 on AR.PERSON_ID = P2.PERSON_ID
            `
        let result = await connection.execute<{
            GROUP_ID : number
        }>(
            query,
            {
                rId : r.id,
                cId : contentId
            },{
                outFormat : oracledb.OUT_FORMAT_OBJECT
            }
        )
        if(!result || !result.rows || result.rows.length == 0 ) return notFound(next, res);
        return res.status(200).json(result.rows);
        
    }
    catch(error){
        console.log(error);
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
})

// post to a groups
router.route('/post/:groupId')
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
    catch(error){
        console.log(error);
        serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
    
})


// get comments of content
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
        
                SELECT COM1.CONTENT_ID, COM1.COMMENT_OF, COM1.POSTED_AT, P.FIRST_NAME || ' ' || P.LAST_NAME as USERNAME, COUNT(COM2.CONTENT_ID) as REPLIES,
                COUNT(V.ROLE_ID) AS UPVOTE,
                COUNT(V2.ROLE_ID) as DOWNVOTE
                FROM COMMENT_ COM1
                JOIN CONTENT CON1 ON COM1.CONTENT_ID = CON1.CONTENT_ID
                JOIN ACADEMIC_ROLE AR ON Ar.ROLE_ID = CON1.ROLE_ID
                JOIN PERSON P ON P.PERSON_ID = Ar.PERSON_ID
                LEFT OUTER JOIN COMMENT_ COM2 ON COM2.COMMENT_OF = CON1.CONTENT_ID
                LEFT OUTER JOIN VOTE V ON V.CONTENT_ID = COM1.CONTENT_ID AND V.DOWN = 'N'
                LEFT OUTER JOIN VOTE V2 ON V2.CONTENT_ID = COM1.CONTENT_ID AND V2.DOWN != 'N'
                WHERE COM1.COMMENT_OF = :cId GROUP BY COM1.CONTENT_ID, COM1.COMMENT_OF, COM1.POSTED_AT, CON1.ROLE_ID, P.FIRST_NAME, P.LAST_NAME

        `
        let result = await connection.execute<{
            GROUP_ID : number
        }>(
            query,
            {
                cId : contentId
            },{
                outFormat : oracledb.OUT_FORMAT_OBJECT,
            }
        )
        if(!result || !result.rows ) return notFound(next, res);
        if(result.rows.length == 0) return res.status(200).json([]);
        let isAuthorized = await checkIfInsideGroup(connection, result.rows[0].GROUP_ID,r.id, next, res);
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
.post(async (req, res, next) =>{
    let ret = extractTableAndId(next, req, res);
    if(!ret){
        return ;
    }
    if(ret.tableName == 'Management'){
        return unAuthorized(next, res);
    }
    let body = req.body;
    if(!body || !body.text || (body.text.trim().length == 0) || !(parseInt(req.params.contentId) >= 0)){
        return invalidForm(next, res);
    }
    let connection;
    try{
        connection = await oracledb.getConnection();
        let query = `
            BEGIN
                :ret := CREATE_COMMENT(:text, :roleId, :commentOf);
            END;
        `
        let result = await connection.execute<{
            ret : {}
        }>(
            query,
            {
                text : req.body.text,
                roleId : ret.id,
                commentOf : req.params.contentId,
                ret : {dir : oracledb.BIND_OUT, type : "COMMENT_%ROWTYPE"},
            },
            {
                autoCommit : true

            }
        )
        if(!result.outBinds || !result.outBinds.ret) return serverError(next, res);
        return res.status(200).json(result.outBinds.ret);
    }
    catch(error){
        console.log(error);
        serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }

})



export default router;