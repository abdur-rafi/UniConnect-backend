var oracledb = require('oracledb');
var bcrypt = require('bcrypt');

oracledb.createPool({
	user          : "c##uniconnect",
	password      : "uniconnect" ,
	connectString : "localhost/orcl",
    poolMax : 100

}).then(async _ =>{
    console.log("here");
	let connection = await oracledb.getConnection();
    // console.log("here");
    
    // let query = 
    // `
    //     BEGIN
    //         GENERATE_SAMPLE_DATE(:d);
    //     END;
    // `
    // let result = await connection.execute(query,
    //     {
    //         d : 5
    //     },
    //     {
    //         autoCommit : true
    //     }
    //     );
    // console.log(result);

    let sampleGenerate = async ()=>{
        // await connection.execute(`
        //     BEGIN
        //         GENERATE_SAMPLE_DATA(6);
        //     END;
        // `);
        let query = `SELECT UNIVERSITY_ID FROM UNIVERSITY`;
        let result = await connection.execute(query);
        let varsityIds = result.rows.map(r => r[0]);
        varsityIds = [9]
        query = `SELECT BATCH_ID FROM BATCH`;
        result = await connection.execute(query);
        // console.log(result);
        let batchIds = result.rows.map(r => r[0]);
        batchIds = [21, 22, 23, 24]
        query = `SELECT DEPARTMENT_ID FROM DEPARTMENT`;
        result = await connection.execute(query);
        let deptIds = result.rows.map(r => r[0]);
        deptIds = [29, 30, 31, 32, 33]
        console.log(varsityIds, batchIds, deptIds);
        // let count = 0;
        
        let pass = 'password';
                        
        let salt = await bcrypt.genSalt()
        let hash = await bcrypt.hash(pass, salt)

        let promises = [] 
        
        varsityIds.forEach(async (vId, vi) =>{
            deptIds.forEach(async (dId, di)=>{
                batchIds.forEach(async (bId, bi)=>{
                    let jA = [1, 2, 3, 4, 5, 6,7,8, 9, 10]
                    jA.forEach(async (j) =>{
                        let count = vId * 1000 + dId * 100 + bId * 10 + j;
                    // ++count;
                        console.log(count)
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
                        })
                        console.log(result);
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
                        console.log('here')
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
                        :rank,
                        :dId,
                        :role,
                        :role,
                        :role
                    );
                END;
            `
            let res = await connection.execute(query,{
                pId : pId,
                gPass : 'password',
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
        let r3 = await connection.execute(
            `
            DECLARE
                d number;
            BEGIN
                d := CREATE_BATCH('adsf',7,'a','pg').BATCH_ID;
            end;
            `
        )
        console.log(r2);
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
