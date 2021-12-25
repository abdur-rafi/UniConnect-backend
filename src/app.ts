import express from 'express';
import oracledb from 'oracledb'
import testRouter from './routes/test'
import bodyParser from 'body-parser'

import userRouter from './routes/login'

require('dotenv').config()

oracledb.createPool({
	user          : "c##uniconnect",
	password      : "uniconnect" ,
	connectString : "localhost/orcl"

}).then(_ =>{
	
	const app = express();
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

	app.listen(3000,()=>{
		console.log("listening on port 3000");
	});
	
})
