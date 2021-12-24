import express from 'express'
import oracledb from 'oracledb'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

let router = express.Router()


router.route('/login')
.post(async (req, res)=>{

    // req body should contain id and body

    let form = req.body;
    console.log(form);
    let id : string = form.id;
    let pass : string = form.password;
    if(!(id && pass)){
        return res.status(400).send("Invalid form");
        
    }
    let splits = id.trim().split('-');
    if(splits.length != 2){
        res.status(400).send("Invalid user id");
    }
    let uniId = parseInt(splits[0]);
    let personId = parseInt(splits[1]);
    let connection = await oracledb.getConnection();
    let result = await connection.execute(
        `
            SELECT 
                PERSON_ID, PASSWORD 
            FROM 
                PERSON
            WHERE
                person_id = :personId
        `,
        {personId : personId}
    )
    console.log(result);
    res.send(result);

})
  

export default router;