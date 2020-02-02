const sass = require('node-sass')

module.exports = {
  dist: {
    options: {
      style: 'compressed',
      implementation: sass,
      sourceMap: true
    },
    files: {
      'public/styles/site.css': 'public/styles/site.scss'
    }
  }
}
