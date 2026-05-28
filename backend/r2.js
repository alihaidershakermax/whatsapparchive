const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadToR2(fileBuffer, fileName, mimetype) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimetype,
  });

  try {
    await r2.send(command);
    return `${process.env.R2_PUBLIC_URL}/${fileName}`;
  } catch (err) {
    console.error("R2 Upload Error:", err);
    throw err;
  }
}

async function deleteFromR2(fileName) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
  });

  try {
    await r2.send(command);
  } catch (err) {
    console.error("R2 Delete Error:", err);
    throw err;
  }
}

module.exports = { uploadToR2, deleteFromR2 };
