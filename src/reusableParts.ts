import { NextFunction } from "express";
import OracleDB from "oracledb";
import { Response, Request } from "express";
export type loggedAs = 'Teacher' | 'Management' | 'Student';
export function closeConnection(connection : undefined | OracleDB.Connection){
    try{
        if(connection){
            connection.close();
        }
    }
    catch(err){
        console.log(err);
    }
}

export function setLocals(status : number, message : string, next: NextFunction, res : Response){
    res.locals.status = status;
    res.locals.message = message;
    next();
}

export function notAuthenticated(next: NextFunction, res : Response){
    setLocals(401,'Not Authenticated', next, res);
}


export function unAuthorized(next: NextFunction, res : Response){
    setLocals(403,'Unauthorized', next, res);
}


export function invalidForm(next: NextFunction, res : Response){
    setLocals(400,'Invalid form', next, res);
}


export function serverError(next: NextFunction, res : Response){
    setLocals(500,'Interval server error ', next, res);
}


export function noUserFound(next: NextFunction, res : Response){
    setLocals(404,'No User Found', next, res);
}


export function invalidCookie(next: NextFunction, res : Response){
    setLocals(401,'Invalid cookie', next, res);
}
export function notFound(next: NextFunction, res : Response){
    setLocals(404,'Not found', next, res);
}



export function extractTableAndId(next : NextFunction, req : Request, res : Response) : null | {
    tableName : loggedAs,
    id : number
}{
    let cookie = req.signedCookies;
    if(!cookie || !cookie.user){
        notAuthenticated(next, res);
        return null;
    }
    let user = cookie.user;
    if(!(user.managementId || user.studentId || user.teacherId)){
        notAuthenticated(next, res);
        return null;
    }
    let tableName : loggedAs;
    let id : number;
    if(user.managementId){
        tableName = 'Management';
        id = user.managementId;
    }
    else if(user.studentId){
        tableName = 'Student';
        id = user.studentId;    
    }
    else{
        tableName = 'Teacher';
        id = user.teacherId;
    }
    return {
        tableName : tableName,
        id : id
    }
    
}

export function getUniQuery(tableName : loggedAs, index = -1) : string{
    let universityQuery;
    if(tableName == 'Teacher' || tableName == 'Student'){
        universityQuery = `
            SELECT UNIVERSITY_ID
            FROM
                ${tableName}
            JOIN
                DEPARTMENT
            USING (DEPARTMENT_ID)
            WHERE
                ROLE_ID = ${index == -1 ? ':id' : (':' + index)}
        `
    }
    else{
        universityQuery = `
            SELECT UNIVERSITY_ID
            FROM 
                MANAGEMENT 
            WHERE
                MANAGEMENT_ID = ${index == -1 ? ':id' : (':' + index)}
        `
    }
    return universityQuery;
}