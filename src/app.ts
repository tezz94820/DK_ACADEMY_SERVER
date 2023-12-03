import express from 'express';
import env from 'dotenv';
import corsOptions from './utils/corsOptions';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import indexRoutes from './routes/indexRoute'
import connectDB from './db/connect'
const app = express();
env.config();

//middlewares
app.use(cors(corsOptions));
app.use(helmet());
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