import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createReadStream } from "fs";
import { Upload } from "@aws-sdk/lib-storage";
import { PassThrough } from 'stream';


const bucket = "dkacademy.store";

const AWSClient = new S3Client({
    region: process.env.AWS_REGION,
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

export const createFolder = async (key:string):Promise<boolean> => {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
    })
    const response = await AWSClient.send(command);
    if(response)
        return true;
    else
        return false;
}


// const createPresignedPdf
export const createPresignedUrlByKey = async (key:string,expiresIn:number) : Promise<string> => {
    const command = new GetObjectCommand({
        Bucket:"dkacademy.store",
        Key: key
    })
    const url = await getSignedUrl(AWSClient,command,{ expiresIn: expiresIn });
    return url;
}

export const uploadFileToFolderInS3 = async (file: Express.Multer.File, key: string): Promise<boolean> => {
    try {

        const bufferStream = new PassThrough();
        bufferStream.end(file.buffer);

      const params = {
        Bucket: bucket,
        Key: key,
        Body: bufferStream,
        ContentType: file.mimetype,
      };
  
      // const command = new PutObjectCommand(params);
      // await AWSClient.send(command);
      const upload = new Upload({ client: AWSClient, params });
      await upload.done();

      return true;
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      return false;
    }
  };


