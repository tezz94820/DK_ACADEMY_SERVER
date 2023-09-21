import express from 'express';
import env from 'dotenv';
const app = express();
env.config();

app.get('/', (req, res) => {
    res.send('Hello World!');
});


const port = process.env.PORT;
app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});