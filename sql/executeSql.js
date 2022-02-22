var oracledb = require('oracledb');
var bcrypt = require('bcrypt');
var {faker} = require('@faker-js/faker');
oracledb.createPool({
	user          : "c##uniconnect_v2",
	password      : "uniconnect" ,
	connectString : "localhost/orcl",
    poolMax : 100

}).then(async _ =>{
	let connection = await oracledb.getConnection();





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

        deptIds.forEach(async d =>{
            let token = faker.datatype.string(9);

            for(let i = 0; i < 5; ++i){
                
                        let query = `
                        DECLARE
                            ret TEACHER%ROWTYPE;
                        BEGIN
                            ret := CREATE_TEACHER(null,:token,:rank,:dId);
                        END;
                    `
                    let rank = 'lecturer';
                    if(i > 3) rank = 'professor';
                    else if(i > 2) rank = 'associate professor'; 
                    await connection.execute(query ,{
                        token : token,
                        dId : d,
                        rank : rank
                    }, {autoCommit : true});
            }
        })
        // await connection.commit();
    }


    let generatePost = async()=>{
        let query = `SELECT ROLE_ID FROM ACADEMIC_ROLE`;
        let result = await connection.execute(query);
        let roles = result.rows.map(r => r[0])
        // console.log(result);
        roles.forEach(async r =>{
            query = `SELECT GROUP_ID FROM GROUP_MEMBER WHERE ROLE_ID = :gId`;
            let result2 = await connection.execute(query, {gId : r});
            let groups = result2.rows.map(r => r[0]);
            for(let i = 0; i < 2; ++i){
                let randomGroup = groups[Math.floor(Math.random() * groups.length)];
                let title = 'This is the title of the post';
                let text = `
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Turpis egestas sed tempus urna et pharetra pharetra. Euismod nisi porta lorem mollis aliquam ut porttitor. Mauris ultrices eros in cursus turpis. Maecenas sed enim ut sem viverra aliquet eget. Viverra maecenas accumsan lacus vel facilisis volutpat est velit egestas. Maecenas sed enim ut sem viverra aliquet eget sit. Sit amet justo donec enim diam vulputate. Proin fermentum leo vel orci porta. Natoque penatibus et magnis dis parturient montes nascetur ridiculus. Molestie ac feugiat sed lectus vestibulum mattis ullamcorper velit sed. Aliquam nulla facilisi cras fermentum odio eu feugiat. In egestas erat imperdiet sed euismod nisi porta lorem.
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
                        roleId : r,
                        title : title,
                        groupId : randomGroup,
                        ret : {dir : oracledb.BIND_OUT, type : "POST%ROWTYPE"}
                    },
                    {autoCommit : true}
                )
            }
        })
        // console.log(result);
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
        
        let query = `SELECT ROLE_ID FROM ACADEMIC_ROLE FETCH NEXT 500 ROWS ONLY`;
        let result = await connection.execute(query);
        let roles = result.rows.map(r => r[0])
        // console.log(roles);
        roles.forEach(async r =>{
            query = `SELECT GROUP_ID FROM GROUP_MEMBER WHERE ROLE_ID = :rId`;
            let result2 = await connection.execute(query, {rId : r});
            let groups = result2.rows.map(r => r[0]);
            // console.log(groups);
            groups.forEach(async groupId =>{

                let posts = (await connection.execute(`
                    SELECT CONTENT_ID FROM CONTENT WHERE GROUP_ID = :gId FETCH NEXT 20 ROWS ONLY
                `, {gId : groupId})).rows.map(r => r[0]);
                // console.log(posts.length);
            //     // console.log("here");
                for(let i = 0; i < 2; ++i){
                    let randomPost = posts[Math.floor(Math.random() * posts.length)];
                    // console.log(randomPost);
                    let query = `
                    DECLARE
                        ret COMMENT_%ROWTYPE;
                    BEGIN
                        ret := CREATE_COMMENT('This is a comment', :roleId, :commentOf);
                    END;
                    `
                    let result2 = await connection.execute(query, {
                        roleId : r,
                        commentOf : randomPost
                    }, {autoCommit : true});
                    console.log(result2);
                }

            })

            
        })

        // let result = await connection.execute(`
        //     SELECT GROUP_ID, ROLE_ID FROM GROUP_MEMBER
        // `
        // )
        // result.rows.forEach(async r =>{
        //     let roleId = r[1];
        //     let groupId = r[0];
        //     let posts = (await connection.execute(`
        //         SELECT CONTENT_ID FROM CONTENT WHERE GROUP_ID = :gId
        //     `, {gId : groupId})).rows.map(r => r[0]);
        //     // console.log("here");
        //     for(let i = 0; i < 2; ++i){
        //         let randomPost = posts[Math.floor(Math.random() * posts.length)];
        //         let query = `
        //         DECLARE
        //             ret COMMENT_%ROWTYPE;
        //         BEGIN
        //             ret := CREATE_COMMENT('This is a comment', :roleId, :commentOf);
        //         END;
        //         `
        //         let result2 = await connection.execute(query, {
        //             roleId : roleId,
        //             commentOf : randomPost
        //         }, {autoCommit : true});
        //         console.log(result2);
        //     }

        // })
        
    }


    let generatePerson = async ()=>{
        let divisions = ['Dhaka', 'Khulna', 'Rajshahi', 'Sylhet'];
        let districts = [['Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Rajbari'],
                            ['Bagerhat, Jessore, Khulna, Kushtia, Narail, Satkhira'],
                            ['Rajshahi', 'Natore', 'Dinajpur', 'Sirajganj', 'Pabna'],
                            ['Habiganj', 'Moulvibazar', 'Sylhet']
                    ];
        let postalCodes = [1000, 1208, 1206, 1211, 1214];
        for(let i = 0; i < 1000; ++i){
            let fName = faker.name.firstName();
            let lName = faker.name.lastName();
            let email = faker.internet.email();
            let houseAddr = faker.address.streetAddress();
            // let dateOfBirth = faker.date.between('2020-01-01T00:00:00.000Z', '2030-01-01T00:00:00.000Z')
            let dateOfBirht = '01/01/1995';
            let password = 'password';
            let salt = await bcrypt.genSalt();
            let hash = await bcrypt.hash(password, salt)
            let phoneNo = null;
            let randomIndx1 = Math.floor(Math.random() * divisions.length);
            let randomDiv = divisions[randomIndx1];
            let ranodmInd2 = Math.floor(Math.random() * divisions[randomIndx1].length);
            let randomDistr = districts[randomIndx1][ranodmInd2];
            let randomPostal = postalCodes[Math.floor(Math.random() * postalCodes.length)];
            let query = `
                DECLARE
                    d PERSON%ROWTYPE;
                BEGIN
                    d := CREATE_PERSON(
                        :fName,
                        :lName,
                        :addr,
                        :email,
                        :phone,
                        TO_DATE(:dBirth,'dd/mm/yyyy'),
                        :pass,
                        :distr,
                        :div,
                        :postal
                    );
                END;
            `
            let res = await connection.execute(query, {
                fName : fName,
                lName : lName,
                addr : houseAddr,
                email : email,
                phone : null,
                dBirth : dateOfBirht,
                pass : hash,
                div : randomDiv,
                distr : randomDistr,
                postal : randomPostal
            }, {autoCommit : true});
            // console.log(res);

        }
    }

    let generateVote = async ()=>{
        
        let query = `SELECT ROLE_ID FROM ACADEMIC_ROLE FETCH NEXT 500 ROWS ONLY`;
        let result = await connection.execute(query);
        let roles = result.rows.map(r => r[0])
        // console.log(roles);
        roles.forEach(async r =>{
            query = `SELECT GROUP_ID FROM GROUP_MEMBER WHERE ROLE_ID = :rId`;
            let result2 = await connection.execute(query, {rId : r});
            let groups = result2.rows.map(r => r[0]);
            // console.log(groups);
            groups.forEach(async groupId =>{

                let posts = (await connection.execute(`
                    SELECT CONTENT_ID FROM CONTENT WHERE GROUP_ID = :gId FETCH NEXT 20 ROWS ONLY
                `, {gId : groupId})).rows.map(r => r[0]);
                // console.log(posts.length);
            //     // console.log("here");
                for(let i = 0; i < 2; ++i){
                    let randomPost = posts[Math.floor(Math.random() * posts.length)];
                    // console.log(randomPost);
                    let query = `
                    DECLARE
                        ret Number;
                    BEGIN
                        ret := TOGGLE_VOTE(:roleId, :contentId, 'N');
                    END;
                    `
                    let result2 = await connection.execute(query, {
                        roleId : r,
                        contentId : randomPost
                    }, {autoCommit : true});
                    console.log(result2);
                }

            })

            
        })
    }
    

    let assingToRoles = async ()=>{
        let query = `SELECT ROLE_ID FROM ACADEMIC_ROLE WHERE PERSON_ID IS NULL`;
        let roles = (await connection.execute(query)).rows.map(r => r[0]);
        query = `SELECT PERSON_ID FROM PERSON`;
        let personIds = (await connection.execute(query)).rows.map(r => r[0]);
        roles.sort(() => Math.random() - 0.5);
        for(let i = 0; i < Math.min(personIds.length, roles.length); ++i){
            query = `UPDATE ACADEMIC_ROLE SET PERSON_ID = :pId where ROLE_ID = :rId`;
            await connection.execute(query , {
                pId : personIds[i],
                rId : roles[i]
            }, {autoCommit : true})
        }
    }

    // generatePerson();
    // generateTeacher();
    // generatePost();
    // generateComment();
    // generateVote();

    assingToRoles();
})
