const { S3Client } = require('@aws-sdk/client-s3');

const bucket = process.env.S3_BUCKET_NAME || null;
const s3Client = bucket ? new S3Client({ region: process.env.AWS_REGION }) : null;

module.exports = { s3Client, bucket };
