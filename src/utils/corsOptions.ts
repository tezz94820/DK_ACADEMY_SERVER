const corsOptions = {
    origin: [
        'https://dkacademy.co.in',
        'https://www.dkacademy.co.in',
        'http://localhost:3000'
    ],
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200,
}

export default corsOptions;