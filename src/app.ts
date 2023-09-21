import express from 'express';
import env from 'dotenv';
import corsOptions from './utils/corsOptions';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import indexRoutes from './routes/indexRoute'
const app = express();
env.config();

//middlewares
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '10kb' })); //body data to json
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //urlencoded data
//development middlewares
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//routes
app.use('/api/v1', indexRoutes);



const port = process.env.PORT;
app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});