import { NextFunction, Request, Response } from "express";
const catchAsync = (fn) => {
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  };
  
  export default catchAsync;