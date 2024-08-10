import axios, { AxiosResponse } from 'axios';
import { PinpointSMSVoiceV2Client, ListTagsForResourceCommand, SendTextMessageCommand, SendTextMessageCommandInput } from "@aws-sdk/client-pinpoint-sms-voice-v2";
import env from 'dotenv';
env.config();

const URL = 'https://www.fast2sms.com/dev/bulkV2';

type returnType = {
    return: boolean,
    request_id?: string,
    message?: [string]
}

const AWSclient = new PinpointSMSVoiceV2Client({ 
  region: "ap-south-1",
  credentials:{
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } 
});

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



const sendOtpAWS = async (otp:string,phone:string):Promise<returnType> => {
  
  if (!phone.startsWith("+91"))
      phone = "+91" + phone;
  
  const params:SendTextMessageCommandInput = {
    DestinationPhoneNumber: phone,
    MessageBody: `Your OTP for registering on DK Academy is ${otp}. Please enter it to complete your registration.`,
    MessageType: "TRANSACTIONAL",
  };
  
  const command = new SendTextMessageCommand(params);

  try {
    // Send the SMS message
    const response = await AWSclient.send(command);
    return {
      return: true,
      request_id: "1234567890",
      message: ['']
    }
  } catch (error) {
    console.log(error.message);
    return {
      return: false
    }
  }
}




export { sendOtp, sendOtpAWS }