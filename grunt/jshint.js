module.exports = {
	options: {
		reporter: 'node_modules/jshint-stylish',
		jshintrc: true
	},
	all: [ 
		'routes/**/*.js',
		'models/**/*.js'
	],
	server: [
		'./keystone.js'
	]
}
