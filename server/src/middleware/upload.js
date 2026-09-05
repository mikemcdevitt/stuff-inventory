const path = require('path');
const multer = require('multer');

const bucket = process.env.S3_BUCKET_NAME;

let storage;

if (bucket) {
  const multerS3 = require('multer-s3');
  const { S3Client } = require('@aws-sdk/client-s3');
  const s3 = new S3Client({ region: process.env.AWS_REGION });

  storage = multerS3({
    s3,
    bucket,
    key: (req, file, cb) => {
      cb(null, `items/${req.params.id}/${Date.now()}-${file.originalname}`);
    },
  });
} else {
  console.warn('S3_BUCKET_NAME not set — falling back to local disk storage in uploads/ (dev only)');
  storage = multer.diskStorage({
    destination: path.join(__dirname, '..', '..', 'uploads'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

module.exports = upload;
