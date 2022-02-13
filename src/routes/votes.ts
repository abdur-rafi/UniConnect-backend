import express, { NextFunction , Response} from 'express'
import oracledb from 'oracledb'
import { closeConnection, extractTableAndId, invalidForm, notAuthenticated, notFound, serverError, setLocals, unAuthorized } from '../reusableParts';

let router = express.Router()

router.route('/vote/:contentId')
.post(async (req, res, next) =>{
    
    let r = extractTableAndId(next, req, res);
    if(!r) return ;
    if(r.tableName == 'Management') return unAuthorized(next, res);
    let contentId = parseInt(req.params.contentId);
    let connection;
    try{

        if(!req.body) return invalidForm(next, res);
        let down = req.body.down;
        if(!down) return invalidForm(next, res);
        if(down != 'Y' && down != 'N') return invalidForm(next, res);
        connection = await oracledb.getConnection();
        oracledb.fetchAsString = [oracledb.CLOB];
        let query = `
            BEGIN
                :ret := TOGGLE_VOTE(:rId, :cId, :down);
            END;                  
        `;
        let result = await connection.execute<{
            ret : number
        }>(query, {
            cId : contentId,
            rId : r.id,
            down : down,
            ret : {dir : oracledb.BIND_OUT, type : oracledb.NUMBER},
        }, {autoCommit : true})
        console.log(result);
        if(!result || !result.outBinds ) return serverError(next, res);

        let ret = result.outBinds.ret;
        if(ret == 1) return unAuthorized(next, res);
        return res.status(200).json({message : "success"});
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