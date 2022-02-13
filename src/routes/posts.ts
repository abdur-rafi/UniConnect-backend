import express from 'express'
import oracledb from 'oracledb'
import { closeConnection, extractTableAndId, getUniQuery, invalidForm, notAuthenticated, notFound, serverError, setLocals, unAuthorized } from '../reusableParts'

let router = express.Router()



router.route('/all/')
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
            GROUP BY C.CONTENT_ID, C.POSTED_AT
            ORDER BY C.POSTED_AT
            FETCH NEXT 25 ROW ONLY
            ) CONTENT_IDS
            JOIN CONTENT C ON C.CONTENT_ID = CONTENT_IDS.CONTENT_ID
            JOIN POST P ON P.CONTENT_ID = C.CONTENT_ID
            JOIN PGROUP G ON G.GROUP_ID = C.GROUP_ID
            JOIN ACADEMIC_ROLE AR on C.ROLE_ID = AR.ROLE_ID
            JOIN PERSON P2 on AR.PERSON_ID = P2.PERSON_ID
            LEFT OUTER JOIN VOTE VOTED ON VOTED.ROLE_ID = :rId AND VOTED.CONTENT_ID = C.CONTENT_ID
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

router.route('/:groupId/:from/:direction/:count/:order')
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
            LEFT OUTER JOIN VOTE VOTED ON VOTED.ROLE_ID = :rId AND VOTED.CONTENT_ID = C.CONTENT_ID
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

router.route('/:contentId')
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
                LEFT OUTER JOIN VOTE VOTED ON VOTED.ROLE_ID = :rId AND VOTED.CONTENT_ID = C.CONTENT_ID
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


router.route('/:groupId')
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


export default router;