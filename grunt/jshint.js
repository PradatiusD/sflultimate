module.exports = {
	options: {
		reporter: 'node_modules/jshint-stylish',
		force: true
	},
	all: [ 'routes/**/*.js',
				 'models/**/*.js'
	],
	server: [
		'./keystone.js'
	]
}
