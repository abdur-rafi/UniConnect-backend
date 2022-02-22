import express from 'express';
import oracledb from 'oracledb'
import bodyParser from 'body-parser'

import morgan from 'morgan'
import cors, {CorsOptions} from 'cors'
import cookieParser from 'cookie-parser'
import nodeCleanup from 'node-cleanup'


import userRouter from './routes/user'
import universityRouter from './routes/university'
import departmentsRouter from './routes/departments'
import batchRouter from './routes/batches';
import groupsRouter from './routes/groups';
import postRouter from './routes/posts';
import commentsRouter from './routes/comments';
import votesRouter from './routes/votes';
import requestRouter from './routes/requests';
import studentsRouter from './routes/students';
import teachersRouter from './routes/teachers';
import rolesRouter from './routes/roles';
import batchDeptRouter from './routes/batchdepts';
import sectionsRouter from './routes/sections';
import managementRouter from './routes/management';
import contentRouter from './routes/content';

require('dotenv').config()

oracledb.createPool({
    user: "c##uniconnect_v2",
    password: "uniconnect",
    connectString: "localhost/orcl",
    poolMax       : 50,
    poolMin       : 20

}).then(_ => {
    let corsOptions: CorsOptions = {
        credentials: true,
        origin: 'http://localhost:3001',
        optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
    }

    nodeCleanup(() => {
        _.close().then();

        oracledb.getPool().close().then();
    })
    const app = express();
    app.use(cors(corsOptions));
    app.use(morgan('dev'));
    app.use(cookieParser(process.env.COOKIE_SECRET));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.get('/', (req, res) => {
        res.send('Hello World');
    })

    app.use('/user', userRouter);
    app.use('/university', universityRouter);
    app.use('/departments', departmentsRouter);
    app.use('/batches', batchRouter);
    app.use('/groups', groupsRouter);
    app.use('/posts', postRouter);
    app.use('/comments', commentsRouter);
    app.use('/votes', votesRouter);
    app.use('/requests', requestRouter);
    app.use('/students', studentsRouter);
    app.use('/teachers', teachersRouter);
    app.use('/roles', rolesRouter);
    app.use('/batchdepts', batchDeptRouter);
    app.use('/sections', sectionsRouter);
    app.use('/managements', managementRouter);
    app.use('/contents', contentRouter);


    app.use((req, res) => {
        res.status(res.locals.status).json({
            message: res.locals.message
        })
    })

    app.listen(3000, () => {
        console.log("listening on port 3000");
    });
})