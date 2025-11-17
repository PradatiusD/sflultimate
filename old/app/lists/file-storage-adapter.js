const { S3Adapter } = require('@keystonejs/file-adapters')

const S3_PATH = 'keystone'
const storage = new S3Adapter({
  bucket: process.env.S3_BUCKET,
  folder: S3_PATH,
  publicUrl: ({ id, filename, _meta }) =>
    `https://d137pw2ndt5u9c.cloudfront.net/${S3_PATH}/${filename}`,
  s3Options: {
    ACL: 'public-read',
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
    region: process.env.S3_REGION
  }
})

module.exports = storage
