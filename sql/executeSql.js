var oracledb = require('oracledb');
var bcrypt = require('bcrypt');

oracledb.createPool({
	user          : "c##uniconnect_v2",
	password      : "uniconnect" ,
	connectString : "localhost/orcl",
    poolMax : 100

}).then(async _ =>{
    console.log("here");
	let connection = await oracledb.getConnection();

    let sampleGenerate = async ()=>{
        let query = `SELECT UNIVERSITY_ID FROM UNIVERSITY`;
        let result = await connection.execute(query);
        let varsityIds = result.rows.map(r => r[0]);
        // varsityIds = [9]
        // batchIds = [21, 22, 23, 24]
        // deptIds = [29, 30, 31, 32, 33]
        console.log(varsityIds);
        // console.log(deptIds);

        // console.log(batchIds);
        // let count = 0;
        
        let pass = 'password';
                        
        let salt = await bcrypt.genSalt()
        let hash = await bcrypt.hash(pass, salt)

        let promises = [] 
        let countg = 0;
        
        varsityIds.forEach(async (vId, vi) =>{
            
            query = `SELECT DEPARTMENT_ID FROM DEPARTMENT WHERE UNIVERSITY_ID =:id`;
            result = await connection.execute(query, {id : vId});
            let deptIds = result.rows.map(r => r[0]);
            deptIds.forEach(async (dId, di)=>{

                query = `SELECT BATCH_ID FROM BATCH WHERE UNIVERSITY_ID = :id`;
                result = await connection.execute(query, {id : vId});
                // console.log(result);
                let batchIds = result.rows.map(r => r[0]);
                batchIds.forEach(async (bId, bi)=>{
                    let jA = [1, 2, 3, 4, 5, 6,7,8, 9, 10]
                    jA.forEach(async (j) =>{
                        let count = vId * 100000 + dId * 1000 + bId * 10 + j;
                        // count = ++countg;
                    // ++count;
                        // console.log(count)
                        query = `
                            BEGIN
                                :ret := CREATE_PERSON(
                                    :fName,
                                    :lName,
                                    :address,
                                    :email,
                                    :phoneNo,
                                    null,
                                    :pass
                                );
                            END;
                        `;
                        let result = await connection.execute(query,{
                            fName : 'first' + count,
                            lName : 'last' + count,
                            address : 'address' + count,
                            email : 'email' + count,
                            phoneNo : '12345' + count,
                            pass : hash,
                            ret : {dir : oracledb.BIND_OUT, type : 'PERSON%ROWTYPE'}
                        }, {autoCommit : true})
                        // console.log(result);
                        let personId = result.outBinds.ret.PERSON_ID;
                        let role;
                        if(j % 5 < 1){
                            role = 'adm';
                        }
                        else if(j % 5 < 3)
                            role = 'mod';
                        else role = 'mem';
                        let section = (j > 5 ) ? 'B' : 'A';
                        let query2 = 
                        `
                            BEGIN
                                :ret := CREATE_STUDENT(
                                    :pId,
                                    :bId,
                                    :dId,
                                    :gPass,
                                    :pass,
                                    :secName,
                                    :secRollNo,
                                    :uniGrRole,
                                    :deptAllGrRole,
                                    :deptAllSGrRole,
                                    :deptSTypeGrRole,
                                    :bGrRole,
                                    :dbGrRoke,
                                    :sGrRoke,
                                    :uniAllStdGrRole,
                                    :uniSTypeGrRole
                                );
                            END;
                        `
                        // console.log('here')
                        promises.push(connection.execute(query2,{
                            pId : personId,
                            bId : bId,
                            dId : dId,
                            gPass : pass,
                            pass : hash,
                            secName : section,
                            secRollNo : j % 5 + 1,
                            uniGrRole : role,
                            deptAllGrRole : role,
                            deptAllSGrRole : role,
                            deptSTypeGrRole : role,
                            bGrRole : role,
                            dbGrRoke : role,
                            sGrRoke : role,
                            uniAllStdGrRole : role,
                            uniSTypeGrRole : role,
                            ret : {dir : oracledb.BIND_OUT, type : 'STUDENT%ROWTYPE'},
                            
                        },
                        {autoCommit : true}
                        ))
                        // console.log(result);
                        // console.log(result.outBinds.ret.PERSON_ID);
                    })
                    
                    
                })
                
            })
        })
        await Promise.all(promises);
        await connection.commit();
    }


    let generateTeacher = async ()=>{
        
        let pass = 'password';
        let salt = await bcrypt.genSalt()
        let hash = await bcrypt.hash(pass, salt)
        let query = `
            SELECT UNIVERSITY_ID FROM UNIVERSITY
        `
        let varsityIds = await connection.execute(query);
        varsityIds = varsityIds.rows.map(r => r[0]);

        query = `SELECT DEPARTMENT_ID FROM DEPARTMENT`;
        let deptIds = await connection.execute(query);
        deptIds = deptIds.rows.map(r => r[0]);

        query = `SELECT PERSON_ID FROM PERSON`;
        let personIds = await connection.execute(query);
        personIds = personIds.rows.map(p => p[0])
        // console.log(varsityIds, deptIds, personIds) 
        personIds.forEach(async pId =>{
            // let randomUni = varsityIds[Math.floor(Math.random()*varsityIds.length)];
            let randomDept = deptIds[Math.floor(Math.random()*deptIds.length)];
            let query = `
                BEGIN
                    :ret := CREATE_TEACHER(
                        :pId,
                        :gPass,
                        :pass,
                        :rank,
                        :dId,
                        :role,
                        :role,
                        :role,
                        :role
                    );
                END;
            `
            // console.log(randomDept);
            let res = await connection.execute(query,{
                pId : pId,
                gPass : pass,
                pass : hash,
                rank : 'professor',
                dId : randomDept,
                role : 'mem',
                ret : {dir : oracledb.BIND_OUT, type : "TEACHER%ROWTYPE"}
            })
            console.log(res);
        })
        await connection.commit();
    }

    try{
        // let r = await connection.execute(`INSERT INTO PERSON(EMAIL, PASSWORD, TIMESTAMP) VALUES ('email1', 'password', '123')`, {}, {}, (err=>{
        //     console.log("err from callback");
        //     throw new Error("asdf");
        // }));
        // let r2 = await connection.execute(
        //     `SELECT * FROM STUDENT WHERE PERSON_ID = 601
        //     `
        // )
        // let r3 = await connection.execute(
        //     `
        //     DECLARE
        //         d number;
        //     BEGIN
        //         d := CREATE_BATCH('adsf',7,'a','pg').BATCH_ID;
        //     end;
        //     `
        // )
        // await sampleGenerate();
        await generateTeacher();

        // console.log(r2);
    } catch(err){
        console.log(err);
        console.log(err.message);
    }
    
    // await generateTeacher();

    // await sampleGenerate();

    // let result = await connection.execute(
    //     'SELECT * FROM PERSON'
    // )
    // console.log(result)

})