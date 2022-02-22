import express from 'express'
import oracledb from 'oracledb'
import bcrypt from 'bcrypt'
import { closeConnection, invalidCookie, invalidForm, notAuthenticated, noUserFound, serverError, setLocals } from '../reusableParts'

let router = express.Router()


router.route('/login')
.post(async (req, res, next)=>{

    let form = req.body;
    let email : string = form.email;
    let pass : string = form.password;

    if(!(email && pass)){
        return invalidForm(next, res);
    }

    let connection;
    try{

        connection = await oracledb.getConnection();

        let personQuery = `
            SELECT person_id as ID, password FROM person 
            WHERE 
            email = :email
        `
        let r = await connection.execute<{
            ID : number,
            PASSWORD : string
        }>(personQuery,{email : email},{outFormat : oracledb.OUT_FORMAT_OBJECT});
        if(!r.rows || r.rows.length == 0){
            return noUserFound(next, res);
        }

        let actualPass = r.rows[0].PASSWORD;
        console.log(r);
        let b = await bcrypt.compare(pass, actualPass);
        if(!b){
            return setLocals(403, 'Invalid Password',next, res);
        }
        
        let personId = r.rows[0].ID;

        let studentQuery = `
            SELECT
                S.ROLE_ID as id,
                U.UNIVERSITY_ID,
                U.NAME as university_name,
                D.NAME as DEPARTMENT_NAME
            FROM 
                STUDENT S
            JOIN 
                DEPARTMENT D
            ON 
                D.department_id = S.department_id
            JOIN
                UNIVERSITY U
            ON 
                U.university_id = D.university_id
            JOIN 
                ACADEMIC_ROLE AR
            ON
                S.ROLE_ID = AR.ROLE_ID
            WHERE 
                AR.PERSON_ID = :pId
        `
        let teacherQuery = `
        SELECT
            T.ROLE_ID as id,
            U.UNIVERSITY_ID,
            U.NAME as university_name,
            D.NAME as DEPARTMENT_NAME
        FROM 
            TEACHER T
        JOIN 
            DEPARTMENT D
        ON 
            D.department_id = T.department_id
        JOIN
            UNIVERSITY U
        ON 
            U.university_id = D.university_id
        JOIN
            ACADEMIC_ROLE AR
        ON
            AR.ROLE_ID = T.ROLE_ID
        WHERE 
            AR.person_id = :pId
        
        `
        let managementQuery = `
            SELECT 
                management_id as ID,
                U.university_id,
                U.Name as university_name
            FROM
                MANAGEMENT M
            JOIN 
                UNIVERSITY U
            ON 
                U.university_id = M.university_id
            WHERE
                person_id = :pId

        `
        let resultStudents = await connection.execute<{
            ID : number,
            UNIVERSITY_ID : number,
            UNIVERSITY_NAME : string
        }>(
            studentQuery,
            {
                pId : personId
            },
            {
                outFormat : oracledb.OUT_FORMAT_OBJECT
            });
    
        let resultTeachers = await connection.execute<{
            ID : number,
            UNIVERSITY_ID : number,
            UNIVERSITY_NAME : string
        }>(
            teacherQuery,
            {
                pId : personId
            },
            {
                outFormat : oracledb.OUT_FORMAT_OBJECT
            }
        )
        let resultManagements = await connection.execute<{
            ID : number,
            UNIVERSITY_ID : number,
            UNIVERSITY_NAME : string
        }>(
            managementQuery,
            {
                pId : personId
            },
            {
                outFormat : oracledb.OUT_FORMAT_OBJECT
            }
        )

        

        res.cookie('user', {
            personId : personId
        }, {
            signed : true
        });

        // console.log(resultTeachers.rows)
        res.status(200).json({
            personInfo : {
                personId : personId
            },
            studentRoles : resultStudents.rows,
            teacherRoles : resultTeachers.rows,
            managementRoles : resultManagements.rows
        })
    }
    catch(error){
        console.log(error);
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
    
})

router.route('/signup')
.post(async (req, res, next)=>{
    let fName : string = req.body.first_name;
    let lName : string = req.body.last_name;
    let houseAdress : string = req.body.house_address;
    let district = req.body.district;
    let division = req.body.division;
    let postalCode = req.body.postal_code;
    let email : string = req.body.email;
    let phoneNo : string = req.body.phone_number;
    let dateOfBirth : string = req.body.date_of_birth;
    let password : string = req.body.password;
    console.log(req.body);

    if(!(fName && lName && houseAdress && email && phoneNo && dateOfBirth && password && district && division && postalCode)){
        return invalidForm(next, res);
    }
    fName = fName.trim();
    lName = lName.trim();
    houseAdress = houseAdress.trim();
    email = email.trim(); 
    phoneNo = phoneNo.trim();
    dateOfBirth = dateOfBirth.trim();
    division = division.trim();
    district = district.trim();
    postalCode = postalCode.trim();

    // password = password.trim();

    if(fName.length < 2 || lName.length < 2 || email.length < 4 || password.length < 5){
        return invalidForm(next, res);
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
                :password,
                :distr,
                :div,
                :postalCode
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
                address : houseAdress,
                email : email,
                phoneNo : phoneNo,
                dateOfBirth : dateOfBirth,
                password : hash,
                distr : district,
                div : division,
                postalCode : postalCode,
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
                        return setLocals(400,'Email or phone number already in use', next, res);
                    }
                    else if(err.errorNum &&( err.errorNum >= 1800 || err.errorNum < 1900)){
                        return setLocals(400, 'invalid date', next, res);
                    }
                    else{
                        return serverError(next, res);
                    }
                }
                if(!result.outBinds){
                    return serverError(next, res);

                }
                else{
                    // console.log(result.outBinds.ret);
                    res.cookie('user', {
                        personId : result.outBinds.ret.PERSON_ID
                    }, {
                        signed : true
                    });
            
                    res.status(200).json(result.outBinds.ret);

                }
                
            })
        )

    }
    catch(error){
        console.log(error);
        return serverError(next, res);

    }
    finally{
        closeConnection(connection);

    }
})


router.route('/login/management/:id')
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
                MANAGEMENT_ID AS ID 
            FROM 
                MANAGEMENT
            WHERE
                PERSON_ID = :pId  AND MANAGEMENT_ID = :mId
            `   
        let result = await connection.execute<{
            ID : number
        }>(
            query,
            {pId : personId, mId : req.params.id},
            {outFormat : oracledb.OUT_FORMAT_OBJECT}
        )
        if( !result.rows || result.rows.length == 0){
            return noUserFound(next, res);
        }
        res.cookie('user', {
            personId : personId,
            managementId : result.rows[0].ID
        }, {
            signed : true
        })
        return res.status(200).json({
            personId : personId,
            managementId : result.rows[0].ID
        })
    }
    catch(error){
        return serverError(next, res);
    }
    finally{
        closeConnection(connection);
    }
})


export default router;  