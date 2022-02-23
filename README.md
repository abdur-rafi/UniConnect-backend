
<p align="center">
 <img width="200px" 
      style="border-radius:50%" src="https://github.com/hishamcse/UniConnect-FrontEnd/blob/master/public/logo.png"  alt="UniConnect"/>
</p>

<h1 align="center"> UniConnect BackEnd</h1><br />

### table of contents
   * [Overview](#overview)
   * [Configuring backend](#configuring-backend)
   * [Languages, Tools and Frameworks](#tools)
   * [ERD](#erd)
   * [Features](#features)
   * [Contributors](#contribute)
   * [Supervisor](#super)

## Overview<a name="overview"></a>
   This is the backend of CSE 216 database term project <b>UniConnect</b> By <b>Syed Jarullah Hisham (1805004)</b> & <b>Abdur Rafi (1805008)</b> <br />
   <b>To see frontend, please use this link:</b> [UniConnect FrontEnd](https://github.com/hishamcse/UniConnect-FrontEnd)

## Configuring backend:
   1. clone this repository or download the repository as zip and unzip it
   2. typescript should be installed if not already installed. to install typescript globally, run 
       ```bash
         npm install -g typescript
       ```
   3. use terminal inside the project and run
       ```bash
         npm install
       ```
   4. ensure database is ready. dump database file is added accordingly
   5. go to <b>app.ts</b> file and update <b>user</b> and <b>password</b> according to the oracle database user
   6. create a .env file at the root folder. In this file, add an arbitrary value for variable <b>COOKIE_SECRET</b>
      for example:  
      ```bash
        COOKIE_SECRET="hhgfjhgfdgasdas"
      ```
   7. using the terminal inside project, run 
      ```bash
        tsc --watch
      ```
      open another terminal and run
      ```bash
        npm run dev
      ```
      This project should work perfectly now on "http://localhost:3000"

## Languages, Tools and Frameworks:<a name="tools"></a>
### frontend:
typescript, reactjs, nextjs, scss, react-bootstrap, material ui, core ui

### backend: 
typescript, nodejs, oracledb, express

## ERD<a name="erd"></a>
[ERD](https://github.com/abdur-rafi/UniConnect-backend/blob/master/ERD/erd.svg)

## Features:<a name="features"></a>
1. signup for an account 
2. login as one of these three roles - management, student, teacher. One can also claim role in case he has roleid and token provided by admin 
3. having a management role of an university, 
      * one can create new department in a university
      * assign any batch with that department
      * create new student and add them at appropriate batch and department
      * create new teacher in a department
      * see the details of the profiles of all students and teacher of his university
4. having a student or teacher role,
   * one will be added to default groups accordingly
   * default groups will be those matching his department, batch, university and roles. 
      For example- a student of BUET CSE 2018 Section A will be added to the groups -> BUET, BUET-UG, CSE-UG, CSE-ALL, Batch 2018, CSE-18, CSE-18-A and so on
   * one can also make custom groups where he can request other members to join his created group
   * members requested to join the custom group will be notified which will come as a notification whenever he will log in
   * requested members can <b>accept or decline</b> the invitation to join the group
   * in a group, the members of that group can post, comment, reply and 
   also cast their upvote and downvote. Thus, the discussion between the members will go on
   * there is also a newsfeed feature. after logging in, a student or teacher can see recent posts from different groups where he is added
   * lastly he can also view the details of students and teachers of various departments and can also search profile by entering their names

## Contributors:<a name="contribute"></a>
   * [Syed Jarullah Hisham (1805004)](https://hishamcse.github.io/)
   * [Abdur Rafi (1805008)](https://github.com/abdur-rafi)

## Supervisor:<a name="super"></a>
   * [Dr. Abu Sayed Md. Latiful Hoque](https://cse.buet.ac.bd/faculty_list/detail/asmlatifulhoque) <br />
     Professor <br />
     Department Of Computer Science And Engineering <br />
     Bangladesh University Of Engineering and Technology
     

#### A video demonstrating all these will be added very soon
