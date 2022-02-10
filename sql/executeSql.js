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


    let generateStudent = async ()=>{
        
        let pass = 'password';
        let salt = await bcrypt.genSalt()
        let hash = await bcrypt.hash(pass, salt)
        
        let query = `SELECT SECTION_NAME, DEPARTMENT_ID, BATCH_ID FROM SECTION`;
        let sections = await connection.execute(query);

        
        query = `SELECT PERSON_ID FROM PERSON`;
        let personIds = await connection.execute(query);
        personIds = personIds.rows.map(p => p[0])

        personIds.forEach(async pId =>{
            // let randomUni = varsityIds[Math.floor(Math.random()*varsityIds.length)];
            let randomSec = sections.rows[Math.floor(Math.random()*sections.rows.length)];
 
            let query = `
                DECLARE
                    sCount Number;
                BEGIN
                    SELECT (COUNT(*) + 1) INTO sCount FROM STUDENT WHERE SECTION_NAME = :secName AND BATCH_ID = :bId AND DEPARTMENT_ID = :dId;
                    :ret := CREATE_STUDENT(
                        :pId,
                        :bId,
                        :dId,
                        :gPass,
                        :pass,
                        :secName,
                        sCount
                    );
                END;
            `
            // console.log(randomDept);
            let res = await connection.execute(query,{
                pId : pId,
                bId : randomSec[2],
                dId : randomSec[1],
                gPass : pass,
                pass : hash,
                secName : randomSec[0],

                ret : {dir : oracledb.BIND_OUT, type : "STUDENT%ROWTYPE"}
            }, {autoCommit : true})
            // console.log(res);
        })
        // await connection.commit();
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
                        :dId
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
                ret : {dir : oracledb.BIND_OUT, type : "TEACHER%ROWTYPE"}
            }, {autoCommit : true})
            // console.log(res);
        })
        // await connection.commit();
    }


    let generatePost = async()=>{
        let type = 'ug';
        let query = `SELECT ROLE_ID, GROUP_ID FROM GROUP_MEMBER`;
        let result = await connection.execute(
            query
        )
        result.rows.forEach(async (row, rI) =>{
            let roleId = row[0];
            let group = row[1];
            for(let i = 0; i < 2; ++i){
                let title = 'this is post title';
                let text = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Turpis egestas sed tempus urna et pharetra pharetra. Euismod nisi porta lorem mollis aliquam ut porttitor. Mauris ultrices eros in cursus turpis. Maecenas sed enim ut sem viverra aliquet eget. Viverra maecenas accumsan lacus vel facilisis volutpat est velit egestas. Maecenas sed enim ut sem viverra aliquet eget sit. Sit amet justo donec enim diam vulputate. Proin fermentum leo vel orci porta. Natoque penatibus et magnis dis parturient montes nascetur ridiculus. Molestie ac feugiat sed lectus vestibulum mattis ullamcorper velit sed. Aliquam nulla facilisi cras fermentum odio eu feugiat. In egestas erat imperdiet sed euismod nisi porta lorem.

                Sapien eget mi proin sed libero enim sed. Gravida quis blandit turpis cursus. Posuere morbi leo urna molestie at elementum. Cursus in hac habitasse platea dictumst quisque sagittis. At ultrices mi tempus imperdiet nulla malesuada pellentesque. Imperdiet dui accumsan sit amet. Ornare aenean euismod elementum nisi quis. Morbi tristique senectus et netus et malesuada. Et tortor consequat id porta nibh. Facilisis sed odio morbi quis. Elit ullamcorper dignissim cras tincidunt. Tortor vitae purus faucibus ornare suspendisse sed nisi lacus sed.
                
                Et odio pellentesque diam volutpat commodo sed egestas egestas. Eu tincidunt tortor aliquam nulla facilisi. Scelerisque fermentum dui faucibus in ornare quam. Vulputate odio ut enim blandit volutpat maecenas. Semper feugiat nibh sed pulvinar proin gravida. Scelerisque varius morbi enim nunc faucibus a pellentesque. Pretium lectus quam id leo in vitae turpis massa sed. At ultrices mi tempus imperdiet nulla malesuada pellentesque. Proin gravida hendrerit lectus a. Id porta nibh venenatis cras sed felis eget velit aliquet. Rhoncus mattis rhoncus urna neque viverra justo nec ultrices. Sagittis orci a scelerisque purus. Et odio pellentesque diam volutpat commodo sed egestas. Proin sagittis nisl rhoncus mattis rhoncus urna neque viverra justo. Pellentesque dignissim enim sit amet venenatis urna. Odio ut enim blandit volutpat maecenas volutpat blandit aliquam. Gravida cum sociis natoque penatibus et magnis dis parturient montes. Risus feugiat in ante metus dictum. Et egestas quis ipsum suspendisse ultrices gravida dictum fusce. Pretium quam vulputate dignissim suspendisse in.                
`                
                let result2 = await connection.execute(
                    `
                        BEGIN
                            :ret := CREATE_POST(
                                :text,
                                :roleId,
                                :title,
                                :groupId
                            );
                        END;
                    `,
                    {
                        text : text,
                        roleId : roleId,
                        title : title,
                        groupId : group,
                        ret : {dir : oracledb.BIND_OUT, type : "POST%ROWTYPE"}
                    },
                    {autoCommit : true}
                )
                // console.log(result2.outBinds.ret); 
            }
            
            // console.log(groups);
        })
        // console.log(result);
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
        // await generateTeacher();

        // console.log(r2);
    } catch(err){
        console.log(err);
        console.log(err.message);
    }


    let generateCustomGroups = async ()=>{
        let query = 'SELECT ROLE_ID FROM ACADEMIC_ROLE';
        let result = await connection.execute(query);
        // console.log(result.rows);
        console.log(result.rows.length);
        let rows = result.rows;

        for(let i = 0; i + 2 < result.rows.length; ++i){
            query = `
            DECLARE 
                t PGROUP%ROWTYPE;
            BEGIN
                t := CREATE_GROUP(:groupName);
                INSERT INTO GROUP_MEMBER(GROUP_ID, ROLE_ID, MEMBER_ROLE) VALUES(t.GROUP_ID, :roleId1, :mRole1);
                INSERT INTO GROUP_MEMBER(GROUP_ID, ROLE_ID, MEMBER_ROLE) VALUES(t.GROUP_ID, :roleId2, :mRole2);
                INSERT INTO GROUP_MEMBER(GROUP_ID, ROLE_ID, MEMBER_ROLE) VALUES(t.GROUP_ID, :roleId3, :mRole3);
            end;
            `;
            // console.log(result.rows[i])

            let groupName =`Group of id: ${rows[i][0]}, ${rows[i + 1][0]}, ${rows[i + 2][0]}`
            let result2 = await connection.execute(query,{
                groupName : groupName,
                roleId1 : rows[i][0],
                mRole1 : 'adm',
                roleId2 : rows[i + 1][0],
                mRole2 : 'mod',
                roleId3 : rows[i + 2][0],
                mRole3 : 'mem',
                
            });
            // console.log(result);
            
        }
        
    }


    let generateComment = async ()=>{
        let result = await connection.execute(`
            SELECT GROUP_ID, ROLE_ID FROM GROUP_MEMBER
        `
        )
        result.rows.forEach(async r =>{
            let roleId = r[1];
            let groupId = r[0];
            let posts = (await connection.execute(`
                SELECT CONTENT_ID FROM CONTENT WHERE GROUP_ID = :gId
            `, {gId : groupId})).rows.map(r => r[0]);
            for(let i = 0; i < 2; ++i){
                let randomPost = posts[Math.floor(Math.random() * posts.length)];
                let query = `
                DECLARE
                    ret COMMENT_%ROWTYPE;
                BEGIN
                    ret := CREATE_COMMENT('this is a comment', :roleId, :commentOf);
                END;
                `
                let result2 = await connection.execute(query, {
                    roleId : roleId,
                    commentOf : randomPost
                }, {autoCommit : true})
            }

        })
        
    }
    
    // await generateTeacher();

    // await sampleGenerate();

    // await generatePost();
    await generateComment();
    // await generateCustomGroups();
    // await generateComment();
    // await connection.commit();

    
    // query = `SELECT SECTION_NAME, DEPARTMENT_ID, BATCH_ID FROM SECTION`;
    // let sections = await connection.execute(query);
    // await generateStudent();
    // console.log(sections);
    // connection.close();

})
