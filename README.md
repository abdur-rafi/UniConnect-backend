
<p align="center">
 <img width="200px" 
      style="border-radius:50%" src="https://github.com/hishamcse/UniConnect-FrontEnd/blob/master/public/logo.png"  alt="UniConnect"/>
</p>

<h1 align="center"> UniConnect BackEnd</h1><br />

 <p align="center">
   This is the backend of CSE 216 database term project <b>UniConnect</b> By Syed Jarullah Hisham (1805004) & Abdur Rafi (1805008). <br />
   <b>To see frontend, please use this link:&nbsp;&nbsp;[UniConnect FrontEnd](https://github.com/hishamcse/UniConnect-FrontEnd) </b>
  </p>

## Configuring backend:
   1. clone this repository or download the repository as zip and unzip it
   2. typescript should be installed if not already installed. to install typescript globally, run <b>"npm install -g typescript"</b>
   3. use terminal inside the project and run <b>'npm install'</b>
   4. ensure database is ready. dump database file is added accordingly
   5. go to app.ts file and update user and password according to the oracle database user
   6. create a .env file at the root folder. In this file, add an arbitrary value for variable <b>COOKIE_SECRET</b>
      for example:  <b>COOKIE_SECRET="hhgfjhgfdgasdas"</b>
   7. using the terminal inside project, run <b>'tsc -watch'</b> and open another terminal and run <b>'npm run dev'</b>.
      This project should work perfectly now on "http://localhost:3000"

## Languages, Tools and Frameworks:
    frontend: typescript, reactjs, nextjs, scss, react-bootstrap, material ui, core ui
    backend: typescript, nodejs, oracledb, express

#### Other details will be updated soon
