import express from 'express'
import oracledb from 'oracledb'

let router = express.Router()


router.route('/')
.get(async (req, res)=>{
    let conn = await oracledb.getConnection();
    let query = 
    `
        BEGIN
            :ret := CREATE_DEPARTMENT(:uniId, :deptName);
        END;
    `
    query = 
    `
        BEGIN
            :ret := CREATE_BATCH(:batchName, :uniId,:year );
        END;
    `

    query = 
    `
        BEGIN
            :ret := CREATE_BATCH_DEPT(:batchId, :deptId );
        END;
    `
    query = 
    `
        BEGIN
            :ret := CREATE_SECTION(:batchId, :deptId,:sectName );
        END;
    `
    try{

        
        let result = await conn.execute(
            query,
            {
                batchId : 1,
                deptId : 3,
                sectName : 'A',
                ret : {dir : oracledb.BIND_OUT, type : "SECTION%ROWTYPE"}
            },
            {
                autoCommit : true
            }
        )
        console.log(result);
        res.send(result);
    }
    catch(err){
        console.log(err);
        res.send(err);
    }
})

export default router;