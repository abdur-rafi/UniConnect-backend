import express from 'express';
import oracledb from 'oracledb'
import testRouter from './routes/test'
import bodyParser from 'body-parser'

import morgan from 'morgan'
import cors, { CorsOptions } from 'cors'
import cookieParser from 'cookie-parser'
import nodeCleanup from 'node-cleanup'


import userRouter from './routes/user'
import univarsityRouter from './routes/university'
import departmentsRouter from './routes/departments'

require('dotenv').config()

oracledb.createPool({
	user          : "c##uniconnect",
	password      : "uniconnect" ,
	connectString : "localhost/orcl"

}).then(_ =>{
	
	let corsOptions : CorsOptions = {
		credentials : true,
		origin: 'http://localhost:3001',
		optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
	}

	nodeCleanup(()=>{
		// console.log("here");
		 oracledb.getPool().close();
	})
	const app = express();
	app.use(cors(corsOptions));
	app.use(morgan('dev'));
	app.use(cookieParser(process.env.COOKIE_SECRET));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended : true
	}));

	app.get('/', (req, res)=> {
		res.send('Hello World');
	})
	app.use('/test', testRouter);
	app.use('/user', userRouter);
	app.use('/university', univarsityRouter);
	app.use('/departments', departmentsRouter);
	app.use((req, res)=>{
		res.status(res.locals.status).json({
			message : res.locals.message
		})
	})

	app.listen(3000,()=>{
		console.log("listening on port 3000");
	});
	
	
})
