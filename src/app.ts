import express from 'express';
import env from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import indexRoutes from './routes/indexRoute'
import connectDB from './db/connect'
const app = express();
env.config() ;



//middlewares
app.use(cors({
    origin: [
        'https://dkacademy.co.in',
        'https://www.dkacademy.co.in',
        'http://localhost:3001'
    ],
    credentials:true,
    // optionSuccessStatus:200,
}));
app.use(helmet());
app.use(express.json({ limit: '100kb' })); //body data to json
app.use(express.urlencoded({ extended: true, limit: '100kb' })); //urlencoded data
//development middlewares
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//routes
app.use('/api/v1', indexRoutes);



//starting the server
const port = process.env.PORT
const start = async (): Promise<void> => {
    try {
        await connectDB(process.env.MONGO_URI)
        app.listen( port, () =>   console.log(`Listening on port ${port}`) )
    } catch (error) {
        console.log(error.message)
    }
}
start()