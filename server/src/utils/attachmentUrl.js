const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, bucket } = require('./s3');

const PRESIGNED_URL_TTL_SECONDS = 60 * 60;

async function resolveAttachmentUrl(attachment) {
  if (attachment.storage === 's3') {
    if (!s3Client) throw new Error('Attachment is stored in S3 but S3_BUCKET_NAME is not configured');
    const command = new GetObjectCommand({ Bucket: bucket, Key: attachment.key });
    return getSignedUrl(s3Client, command, { expiresIn: PRESIGNED_URL_TTL_SECONDS });
  }
  return `/uploads/${attachment.key}`;
}

async function withResolvedAttachmentUrls(itemDoc) {
  const item = itemDoc.toObject ? itemDoc.toObject() : itemDoc;
  item.attachments = await Promise.all(
    (item.attachments || []).map(async (attachment) => ({
      ...attachment,
      url: await resolveAttachmentUrl(attachment),
    }))
  );
  return item;
}

function withResolvedAttachmentUrlsMany(itemDocs) {
  return Promise.all(itemDocs.map(withResolvedAttachmentUrls));
}

module.exports = { withResolvedAttachmentUrls, withResolvedAttachmentUrlsMany };
