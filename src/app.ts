import express from 'express';
import oracledb from 'oracledb'
import testRouter from './routes/test'
import bodyParser from 'body-parser'

import userRouter from './routes/login'
import univarsityRouter from './routes/university'
import morgan from 'morgan'
import cors, { CorsOptions } from 'cors'
import cookieParser from 'cookie-parser'

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

	const app = express();
	app.use(cors(corsOptions));
	app.use(morgan('dev'));
	app.use(cookieParser(process.env.COOKIE_SECRET));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended : true
	}));

	// app.use((req, res, next)=>{
	// 	console.log(req);
	// 	next();
	// })


	app.get('/', (req, res)=> {
		res.send('Hello World');
	})
	app.use('/test', testRouter);
	app.use('/user', userRouter);
	app.use('/uni', univarsityRouter);

	app.listen(3000,()=>{
		console.log("listening on port 3000");
	});
	
})
