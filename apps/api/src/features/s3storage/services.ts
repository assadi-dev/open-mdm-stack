import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ENV } from "@config/env";

export class S3StorageServices {
    private s3Client: S3Client;
    constructor() {
        this.s3Client = new S3Client({
            region: ENV.S3_REGION,
            endpoint: ENV.S3_ENDPOINT,
            credentials: {
                accessKeyId: ENV.S3_ACCESS_KEY,
                secretAccessKey: ENV.S3_SECRET_KEY,
            },
            forcePathStyle: true,
        });
    }


    uploadFile(key: string, file: File) {
        const uploadParams = {
            Bucket: ENV.S3_BUCKET,
            Key: key,
            Body: file,
        };
        return this.s3Client.send(new PutObjectCommand(uploadParams));
    }

    removeFile(key: string) {
        const deleteParams = {
            Bucket: ENV.S3_BUCKET,
            Key: key,
        };
        return this.s3Client.send(new DeleteObjectCommand(deleteParams));
    }


}