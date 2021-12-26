import express from 'express'
import oracledb from 'oracledb'
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
        return res.status(400).send("Invalid user id");
    }
    let uniId = parseInt(splits[0]);
    let personId = parseInt(splits[1]);
    let connection = await oracledb.getConnection();
    let result = await connection.execute<{
        PERSON_ID : number,
        PASSWORD : string
    }>(
        `
            SELECT 
                PERSON_ID, PASSWORD 
            FROM 
                PERSON
            WHERE
                person_id = :personId
        `,
        {personId : personId},
        {outFormat : oracledb.OUT_FORMAT_OBJECT}
    )
    // console.log(result);
    // res.send(result);
    if(!result.rows || result.rows.length == 0){
        return res.status(403).send("No User Found")
    }
    let actualPass = result.rows[0].PASSWORD;
    let b = await bcrypt.compare(pass, actualPass);
    if(!b){
        return res.status(403).send("Invalid Password");
    }
    
    
    let query = 
    `
        SELECT 
            P.person_id as ID,
            P.first_name || ' ' || P.last_name as NAME ,
            S.STUDENT_ID,
            T.TEACHER_ID,
            U.UNIVERSITY_ID,
            U.NAME as STUDENT_UNIVERSITY_NAME,
            U2.UNIVERSITY_ID as TEACHER_UNIVERSITY_ID,
            U2.NAME as TEACHER_UNIVERSITY_NAME

        FROM 
            PERSON P
        FULL OUTER JOIN
            STUDENT S 
        ON 
            S.PERSON_ID = P.PERSON_ID
        FULL OUTER JOIN 
            DEPARTMENT D
        ON 
            D.DEPARTMENT_ID = S.DEPARTMENT_ID
        FULL OUTER JOIN
            UNIVERSITY U
        ON
            U.UNIVERSITY_ID =  D.UNIVERSITY_ID

        FULL OUTER  JOIN
            TEACHER T
        ON
            T.PERSON_ID = P.PERSON_ID
        FULL OUTER  JOIN 
            DEPARTMENT D2
        ON 
            D2.DEPARTMENT_ID = T.DEPARTMENT_ID
        FULL OUTER  JOIN
            UNIVERSITY U2
        ON
            U2.UNIVERSITY_ID =  D2.UNIVERSITY_ID
        WHERE 
            P.PERSON_ID = :pId

    `
    let result2 = await connection.execute<{
        ID : number,
        NAME : string,
        STUDENT_ID : number | null,
        TEACHER_ID : number | null,
        UNIVERSITY_ID: number | null,
        STUDENT_UNIVERSITY_NAME:string | null,
        TEACHER_UNIVERSITY_ID: number | null,
        TEACHER_UNIVERSITY_NAME: number | null,
    
    }>(query,
         {pId : personId},{outFormat : oracledb.OUT_FORMAT_OBJECT});

    res.cookie('user', {
        person_id : personId
    }, {
        signed : true
    });

    res.status(200).json({
        ...result2.rows![0]
    })
        //  console.log(token);


    // if(fPerson)
})
  

export default router;