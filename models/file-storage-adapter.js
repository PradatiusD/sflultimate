const keystone = require('keystone')
const storage = new keystone.Storage({
  adapter: require('keystone-storage-adapter-s3'),
  s3: {
    path: '/keystone',
    publicUrl: 'https://d137pw2ndt5u9c.cloudfront.net',
    uploadParams: {
      ACL: 'public-read'
    }
  },
  schema: {
    bucket: true,
    etag: true,
    path: true,
    url: true
  }
})

module.exports = storage
