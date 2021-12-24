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

    await connection.execute(`
        BEGIN
            GENERATE_SAMPLE_DATA(6);
        END;
    `);
    let query = `SELECT UNIVERSITY_ID FROM UNIVERSITY`;
    let result = await connection.execute(query);
    let varsityIds = result.rows.map(r => r[0]);
    query = `SELECT BATCH_ID FROM BATCH`;
    result = await connection.execute(query);
    // console.log(result);
    let batchIds = result.rows.map(r => r[0]);
    query = `SELECT DEPARTMENT_ID FROM DEPARTMENT`;
    result = await connection.execute(query);
    let deptIds = result.rows.map(r => r[0]);
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
                    let count = vi * 1000 + di * 100 + bi * 10 + j;
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

})
