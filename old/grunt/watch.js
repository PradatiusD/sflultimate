module.exports = {
  express: {
    files: [
      'keystone.js',
      'public/js/lib/**/*.{js,json}'
    ],
    tasks: ['jshint:server', 'concurrent:dev']
  },
  sass: {
    files: ['public/styles/**/*.scss'],
    tasks: ['sass']
  },
  livereload: {
    files: [
      'public/styles/**/*.css',
      'templates/**/*.jade'
    ],
    options: {
      livereload: true
    }
  }
}
