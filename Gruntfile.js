require('dotenv').config();

module.exports = function(grunt) {

	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	// Time how long tasks take. Can help when optimizing build times
	require('time-grunt')(grunt);

	var options = {
		config: {
			src: './grunt/*.js'
		},
		pkg: grunt.file.readJSON('package.json'),
		nodemon: {
			serve: {
				script: 'keystone.js',
				options: {
					ignore: ['node_modules/**', 'public/**']
				}
			}
		},
		shell: {
			mongorestore: {
				command: [
					process.env.DATABASE_DUMP_COMMAND,
					'mongo sflultimate  -uroot -ppassword --authenticationDatabase=admin --eval \'printjson(db.dropDatabase())\'',
					'mongorestore -uroot -ppassword --authenticationDatabase=admin --noIndexRestore -d sflultimate dump/heroku_8xfcj7cs/',
				].join(' && ')
			}
		}
	};

	var configs = require('load-grunt-configs')(grunt, options);
	
	// Project configuration.
	grunt.initConfig(configs);

	// load jshint
	grunt.registerTask('lint', ['jshint']);

	grunt.registerTask('dev', [
		'sass',
		'watch'
	]);

	grunt.registerTask('restore', [
		'shell:mongorestore'
	]);

	// default option to connect server
	grunt.registerTask('serve', [
		'jshint',
		'concurrent:dev'
	]);

	grunt.registerTask('server', function () {
		grunt.task.run(['serve:' + target]);
	});

	grunt.registerTask('default', ['serve'])
};
