const { Text, File } = require('@keystonejs/fields')
const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const storage = require('./file-storage-adapter')
const CustomDateTime = require('../custom-fields/CustomDateTime')

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
    type: Wysiwyg
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
  }
}
