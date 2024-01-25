import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createReadStream } from "fs";
import { Upload } from "@aws-sdk/lib-storage";
import { PassThrough } from 'stream';


const PrivateBucket = "dkacademy.store";
const publicBucket = "dkacademy.public";
export const publicBaseUrl = (key:string) => `https://s3.ap-south-1.amazonaws.com/dkacademy.public/${key}`;
const chooseBucket = (bucket: string) => bucket === 'private' ? PrivateBucket : bucket === 'public' ? publicBucket : null;

const AWSClient = new S3Client({
    region: process.env.AWS_REGION,
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

export const createFolder = async (bucket:string,key:string):Promise<boolean> => {
    const command = new PutObjectCommand({
        Bucket: chooseBucket(bucket),
        Key: key,
    })
    const response = await AWSClient.send(command);
    if(response)
        return true;
    else
        return false;
}


// const createPresignedPdf
export const createPresignedUrlByKey = async (bucket:string,key:string,expiresIn:number) : Promise<string> => {
    const command = new GetObjectCommand({
        Bucket:chooseBucket(bucket),
        Key: key
    })
    const url = await getSignedUrl(AWSClient,command,{ expiresIn: expiresIn });
    return url;
}

export const uploadFileToFolderInS3 = async (bucket:string,file: Express.Multer.File, key: string): Promise<boolean> => {
    try {

        const bufferStream = new PassThrough();
        bufferStream.end(file.buffer);

      const params = {
        Bucket: chooseBucket(bucket),
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


  export const createPresignedPutUrlByKey = async (bucket:string,key:string,contentType:string,expiresIn:number) : Promise<string> => {
    const command = new PutObjectCommand({
        Bucket: chooseBucket(bucket),
        Key: key,
        ContentType: contentType
    })
    const url = await getSignedUrl(AWSClient,command,{ expiresIn: expiresIn });
    return url;
  }



// delete object using key
export const deleteObjectByKey = async (bucket:string,key:string):Promise<boolean> => {
    const command = new DeleteObjectCommand({
        Bucket: chooseBucket(bucket),
        Key: key,
    })
    const response = await AWSClient.send(command);
    if(response)
        return true;
    else
        return false;
}


// get the list of keys starting with the given prefix
export const getListOfKeysStartingWithPrefix = async (bucket:string, prefix:string):Promise<string[]> => {
    
    const command = new ListObjectsV2Command({
        Bucket: chooseBucket(bucket),
        MaxKeys: 1000, // the default max keys to fetch is 1000 
        Prefix: prefix
    })

    let response:string[] = [];
    
    // this is used for continuation of fetching all keys. because limit is 1000 keys. if there exists more it will fetch in another request 
    let isTruncated = true;
    while (isTruncated) {
        const { Contents, IsTruncated, NextContinuationToken } = await AWSClient.send(command);
        response = [...response, ...Contents.map((item) => item.Key as string)];
        isTruncated = IsTruncated;
        command.input.ContinuationToken = NextContinuationToken;
    }

    return response;
}