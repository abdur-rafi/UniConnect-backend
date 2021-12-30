import { NextFunction } from "express";
import OracleDB from "oracledb";
import { Response } from "express";
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
