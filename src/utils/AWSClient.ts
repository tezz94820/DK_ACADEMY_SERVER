import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
        Key: key
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