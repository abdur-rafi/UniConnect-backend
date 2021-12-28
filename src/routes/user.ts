import express from 'express'
import oracledb from 'oracledb'
import bcrypt from 'bcrypt'

let router = express.Router()


router.route('/login')
.post(async (req, res)=>{

    let form = req.body;
    let email : string = form.email;
    let pass : string = form.password;

    if(!(email && pass)){
        return res.status(400).send("Invalid form");
    }

    try{

        let connection = await oracledb.getConnection();

        let query = 
        `
            SELECT 
                P.person_id as ID,P.password as PASSWORD,
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
                P.EMAIL = :email

        `
        let result = await connection.execute<{
            ID : number,
            NAME : string,
            PASSWORD : string,
            STUDENT_ID : number | null,
            TEACHER_ID : number | null,
            UNIVERSITY_ID: number | null,
            STUDENT_UNIVERSITY_NAME:string | null,
            TEACHER_UNIVERSITY_ID: number | null,
            TEACHER_UNIVERSITY_NAME: number | null,
        
        }>(
            query,
            {
                email : email
            },
            {
                outFormat : oracledb.OUT_FORMAT_OBJECT
            });
        
        if(!result || !result.rows || result.rows?.length == 0){
            return res.status(404).json({
                message : "No User Found"
            })
        }


        let actualPass = result.rows[0].PASSWORD;
        let b = await bcrypt.compare(pass, actualPass);
        if(!b){
            return res.status(403).send("Invalid Password");
        }

        res.cookie('user', {
            person_id : result.rows[0].ID
        }, {
            signed : true
        });

        res.status(200).json({
            ...result.rows
        })
        await connection.close()
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            message : "Internal Server Error"
        })
    }
    
})


router.route('/signup')
.post(async (req, res)=>{
    let fName : string = req.body.first_name;
    let lName : string = req.body.last_name;
    let address : string = req.body.address;
    let email : string = req.body.email;
    let phoneNo : string = req.body.phone_number;
    let dateOfBirth : string = req.body.date_of_birth;
    let password : string = req.body.password;
    console.log(req.body);

    if(!(fName && lName && address && email && phoneNo && dateOfBirth && password)){
        return res.status(400).json({
            message : "invalid form"
        })
    }
    fName = fName.trim();
    lName = lName.trim();
    address = address.trim();
    email = email.trim();
    phoneNo = phoneNo.trim();
    dateOfBirth = dateOfBirth.trim();
    // password = password.trim();

    if(fName.length < 2 || lName.length < 2 || email.length < 4 || password.length < 5){
        return res.status(400).json({
            message : "invalid form"
        })
    }

    
    let salt = await bcrypt.genSalt()
    let hash = await bcrypt.hash(password, salt)
    
    let query = 
    `
        BEGIN
            :ret := CREATE_PERSON(
                :fName,
                :lName,
                :address,
                :email,
                :phoneNo,
                TO_DATE(:dateOfBirth,'dd/mm/yyyy'),
                :password
            );
        END;
    `
    let connection;
    try{
        connection = await oracledb.getConnection();
        connection.execute<{
            ret : {
                PERSON_ID : number,
                FIRST_NAME : string,
                LAST_NAME : string,
                ADDRESS : string,
                EMAIL : string,
                PHONE_NO : string,
                DATE_OF_BIRTH : string,
                PASSWORD : string,
                TIMESTAMP : string
            }
        }>(
            query,
            {
                fName : fName,
                lName : lName,
                address : address,
                email : email,
                phoneNo : phoneNo,
                dateOfBirth : dateOfBirth,
                password : hash,
                ret : {dir : oracledb.BIND_OUT, type : "PERSON%ROWTYPE"}
            },
            {
                outFormat : oracledb.OUT_FORMAT_OBJECT,
                autoCommit : true
            },
            ((err, result) =>{
                console.log(err, result);
                if(err){
                    console.log(err);
                    if(err.errorNum == 1){
                        return res.status(400).json({
                            message : "Email already in use"
                        })
                    }
                    else if(err.errorNum &&( err.errorNum >= 1800 || err.errorNum < 1900)){
                        return res.status(400).json({
                            message : "invalid date"
                        })
                    }
                    else{
                        return res.status(500).json({
                            message : "internal server error"
                        })
                    }
                }
                if(!result.outBinds){
                    return res.status(500).json({
                        message : "internal server error"
                    })
                }
                else{
                    // console.log(result.outBinds.ret);
                    res.status(200).json(result.outBinds.ret);
                }
                
            })
        )

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            message : "internal server error"
        })
    }
    finally{
        if(connection){
            connection.close();
        }
    }
})

export default router;  