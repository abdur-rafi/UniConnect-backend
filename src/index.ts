import express from 'express';
import oracledb from 'oracledb'
import testRouter from './routes/test'

oracledb.createPool({
	user          : "c##uniconnect",
	password      : "uniconnect" ,
	connectString : "localhost/orcl"

}).then(_ =>{
	
	const app = express();



	app.get('/', (req, res)=> {
		res.send('Hello World');
	})
	app.use('/test', testRouter);
	

	app.listen(3000,()=>{
		console.log("listening on port 3000");
	});
	
})
