import express from 'express'
import oracledb from 'oracledb'

let router = express.Router()


router.route('/')
.get(async (req, res)=>{
    let conn = await oracledb.getConnection();
    let result = await conn.execute(
        `
        BEGIN
            :ret := CREATE_UNIVERSITY(:name);
        END;
        `,
        {
            name : "testFromNdode",
            ret : {dir : oracledb.BIND_OUT, type : "UNIVERSITY%ROWTYPE"}
        },
        {
            autoCommit : true
        }
    )
    console.log(result);
    res.send("test route");
})

export default router;