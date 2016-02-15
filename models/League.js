var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * League Model
 * =============
 */

var League = new keystone.List('League', {
	map:{
		name: 'title'
	}
});

League.add({
  title: { 
    type: String, 
    initial:  true,
    required: true, 
    index:    true
  }
});

League.register();