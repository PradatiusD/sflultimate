module.exports = {
  debug: {
    script: 'keystone.js',
    options: {
      nodeArgs: ['--debug'],
      ignore: ['cypress/**', 'public/**'],
      env: {
        port: 5000
      }
    }
  }
}
