var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Team Model
 * =============
 */

var Team = new keystone.List('Team', {
	map:{
		name: 'name'
	}
});

Team.add({
  name: { 
    type: String, 
    initial:  true,
    required: true, 
    index:    true 
  },
	captains: {
		type: Types.Relationship,
		ref:  'Player',
		many: true
	},
	players: {
		type: Types.Relationship,
		ref: 'Player',
		many: true
	},
	league: {
		type: Types.Relationship,
		ref: 'League'
	}
});


Team.defaultColumns = 'name, captains, league';


Team.register();