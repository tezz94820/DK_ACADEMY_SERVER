import { Response } from "express";

const sendSuccess = (res:Response, code:number, message:string, data:{}):void => {
    const sendData = {
      code,
      message,
      data
    };
  
    res.status(code).json(sendData);
  }
  
  const sendError = (res:Response, code:number, message:string, error:{}) => {
    const sendData = {
      code,
      message,
      error
    };
    res.status(code).json(sendData);
  }
  
  export  {
    sendSuccess,
    sendError
  };
  