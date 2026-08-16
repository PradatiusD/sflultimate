const { randomUUID } = require('crypto')
const { Text, File } = require('@keystonejs/fields')
const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const UploadableWysiwyg = require('../custom-fields/UploadableWysiwyg')
const storage = require('./file-storage-adapter')
const CustomDateTime = require('../custom-fields/CustomDateTime')

const allowedEmbeddedImageTypes = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp'
])

const fields = {
  title: {
    type: Text,
    required: true
  },
  publishedDate: {
    type: CustomDateTime,
    initial: true
  },
  slug: {
    type: Text,
    required: true
  },
  summary: {
    type: Wysiwyg
  },
  body: {
    type: UploadableWysiwyg
  },
  image: {
    type: File,
    adapter: storage
  }
}

//   state: {
//     type: Types.Select,
//     options: 'draft, published, archived',
//     default: 'draft',
//     index: true
//   },
//   author: {
//     type: Types.Relationship,
//     ref: 'Player',
//     index: true
//   },

//   },
//   categories: { type: Types.Relationship, ref: 'PostCategory', many: true }
// })
//
// Post.schema.virtual('content.full').get(function () {
//   return this.content.extended || this.content.brief
// })
//
// Post.defaultColumns = 'title, state|20%, author|20%, publishedDate|20%'
// Post.register()
//

module.exports = {
  fields,
  labelResolver: item => item.title,
  adminConfig: {
    defaultColumns: 'name, publishedDate, summary'
  },
  extendGraphQLSchema: {
    types: [
      {
        type: `
          type WysiwygImageUploadResult {
            filename: String!
            publicUrl: String!
          }
        `
      }
    ],
    mutations: [
      {
        schema: 'uploadWysiwygImage(file: Upload!): WysiwygImageUploadResult',
        resolver: async (item, { file }, context) => {
          if (!context.authedItem || context.authedListKey !== 'User') {
            throw new Error('Not authorized')
          }

          const upload = await file

          if (!allowedEmbeddedImageTypes.has(upload.mimetype)) {
            throw new Error('Only JPG, PNG, GIF, and WebP images can be uploaded inside a post.')
          }

          const savedFile = await storage.save({
            stream: upload.createReadStream(),
            filename: upload.filename,
            mimetype: upload.mimetype,
            encoding: upload.encoding,
            id: randomUUID()
          })

          return {
            filename: savedFile.filename,
            publicUrl: storage.publicUrl(savedFile)
          }
        }
      }
    ]
  }
}
