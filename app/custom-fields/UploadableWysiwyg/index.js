const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')

module.exports = {
  type: Wysiwyg.type,
  implementation: Wysiwyg.implementation,
  views: {
    Controller: Wysiwyg.views.Controller,
    Filter: Wysiwyg.views.Filter,
    Field: require.resolve('./views/Field')
  },
  adapters: Wysiwyg.adapters
}
