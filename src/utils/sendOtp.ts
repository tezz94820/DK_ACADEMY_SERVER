import axios, { AxiosResponse } from 'axios';
const URL = 'https://www.fast2sms.com/dev/bulkV2';

type returnType = {
    return: boolean,
    request_id: string,
    message: [string]}
const sendOtp = async (otp:string,phone:string):Promise<returnType> => {
    try {
        const response = await axios.post(URL, {},{
            headers: {
              "authorization": process.env.FAST2SMS_API_KEY
            },
            params: {
              variables_values: otp,
              route: "otp",
              numbers: phone,
            },
          });

          return response.data;
    } catch (error) {
        console.log(error);
    }

}



export default sendOtp