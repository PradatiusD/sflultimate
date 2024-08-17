require('dotenv').config()

module.exports = function (grunt) {
  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt)

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt)

  const dbName = 'sflultimateV5'
  const options = {
    config: {
      src: './grunt/*.js'
    },
    pkg: grunt.file.readJSON('package.json'),
    nodemon: {
      serve: {
        script: 'keystone.js',
        options: {
          ignore: ['node_modules/**', 'public/**', 'cypress/**']
        }
      }
    },
    shell: {
      mongorestore: {
        command: [
          process.env.DATABASE_DUMP_COMMAND,
          'mongo ' + dbName + ' --eval \'printjson(db.dropDatabase())\'',
          'mongorestore --noIndexRestore -d ' + dbName + ' dump/sflultimate/'
        ].join(' && ')
      }
    }
  }

  const configs = require('load-grunt-configs')(grunt, options)

  // Project configuration.
  grunt.initConfig(configs)

  grunt.registerTask('dev', [
    'sass',
    'watch'
  ])

  grunt.registerTask('restore', [
    'shell:mongorestore'
  ])

  // default option to connect server
  grunt.registerTask('serve', [
    'concurrent:dev'
  ])

  grunt.registerTask('server', function () {
    grunt.task.run(['serve:' + target])
  })

  grunt.registerTask('default', ['serve'])
}
