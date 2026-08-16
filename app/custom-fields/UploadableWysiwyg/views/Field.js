'use strict'

const React = require('react')
const { FieldContainer, FieldLabel } = require('@arch-ui/fields')

require('tinymce/tinymce')

const { Editor } = require('@tinymce/tinymce-react')

const defaultOptions = {
  autoresize_bottom_margin: 20,
  base_url: '/tinymce-assets',
  branding: false,
  menubar: false,
  plugins: 'link lists code autoresize paste quickbars hr table emoticons image',
  statusbar: false,
  toolbar:
    'formatselect forecolor | alignleft aligncenter alignright alignjustify | bullist numlist indent outdent | link unlink | image table emoticons hr | code',
  quickbars_selection_toolbar:
    'bold italic underline strikethrough | h1 h2 h3 | quicklink blockquote removeformat',
  quickbars_insert_toolbar: false,
  width: '100%'
}

const uploadImageMutation = `
  mutation UploadWysiwygImage($file: Upload!) {
    uploadWysiwygImage(file: $file) {
      filename
      publicUrl
    }
  }
`

const uploadEditorImage = (blobInfo, progress) => new Promise((resolve, reject) => {
  const operations = {
    query: uploadImageMutation,
    variables: { file: null }
  }

  const formData = new FormData()
  formData.append('operations', JSON.stringify(operations))
  formData.append('map', JSON.stringify({ 0: ['variables.file'] }))
  formData.append('0', blobInfo.blob(), blobInfo.filename())

  const request = new XMLHttpRequest()
  request.open('POST', '/admin/api')
  request.withCredentials = true

  request.upload.addEventListener('progress', event => {
    if (event.lengthComputable && typeof progress === 'function') {
      progress(Math.round(event.loaded / event.total * 100))
    }
  })

  request.addEventListener('load', () => {
    let payload

    try {
      payload = JSON.parse(request.responseText)
    } catch (error) {
      reject(new Error('Upload failed'))
      return
    }

    if (request.status < 200 || request.status >= 300 || payload.errors) {
      const message = payload.errors && payload.errors[0] ? payload.errors[0].message : 'Upload failed'
      reject(new Error(message))
      return
    }

    const uploadedImage = payload.data && payload.data.uploadWysiwygImage

    if (!uploadedImage || !uploadedImage.publicUrl) {
      reject(new Error('Upload failed'))
      return
    }

    resolve(uploadedImage.publicUrl)
  })

  request.addEventListener('error', () => {
    reject(new Error('Upload failed'))
  })

  request.send(formData)
})

const createEditorOptions = overrideOptions => ({
  ...defaultOptions,
  ...overrideOptions,
  automatic_uploads: true,
  file_picker_types: 'image',
  image_title: true,
  images_upload_handler: (blobInfo, success, failure, progress) => {
    uploadEditorImage(blobInfo, progress)
      .then(success)
      .catch(error => {
        failure(error.message || 'Upload failed')
      })
  }
})

const WysiwygField = ({
  onChange,
  autoFocus,
  field,
  errors = [],
  value = '',
  isDisabled
}) => {
  const handleChange = nextValue => {
    if (typeof nextValue === 'string') {
      onChange(nextValue)
    }
  }

  const htmlID = `ks-input-${field.path}`
  const accessError = errors.find(error => error instanceof Error && error.name === 'AccessDeniedError')

  if (accessError) {
    return null
  }

  return React.createElement(
    FieldContainer,
    null,
    React.createElement(FieldLabel, {
      htmlFor: htmlID,
      field,
      errors
    }),
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flex: 1
        }
      },
      React.createElement('style', null, `
        .tox-tinymce {
          border-radius: 5px !important;
          border-color: #c1c7d0 !important;
        }
      `),
      React.createElement(Editor, {
        init: {
          ...createEditorOptions(field.config.editorConfig || {}),
          auto_focus: autoFocus
        },
        onEditorChange: handleChange,
        value,
        disabled: isDisabled
      })
    )
  )
}

module.exports = WysiwygField
