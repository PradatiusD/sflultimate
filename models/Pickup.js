var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * League Model
 * =============
 */

var Pickup = new keystone.List('Pickup', {
  map: {name: 'title'}
});

var fields = {
  title: { 
    type:     String,
    initial:  true,
    required: true, 
    index:    true,
    label:  "Pickup Name"
  },
  day: {
    type:     String,
    initial:  true,
    required: true,
    label: "Day(s) Played"
  },
  time: {
    type:     String,
    initial:  true,
    required: true,
    label: "Start Time"
  },
  'contact.name': {
    type:     String,
    initial:  true
  },
  'contact.email': {
    type: Types.Email, 
    initial: true
  },
  'contact.phone': {
    type:     String,
    initial:  true
  },
  'contact.url': {
    type:    Types.Url,
    initial: true,
    label:   'Contact URL'
  },
  'location.name': {
    type:     String,
    initial:  true,
    required: true
  },
  'location.type': {
    type: Types.Select,
    options: ["grass","turf", "beach", "indoor"],
    initial:  true,
    required: true,
    label: 'Field Type'
  },
  'location.address.street': {
    type:     String,
    initial:  true,
    required: true,
    label: 'Street Address'
  },
  'location.address.city': {
    type:     String,
    initial:  true,
    required: true,
    label: 'City'
  },
  'location.address.state': {
    type:     String,
    initial:  true,
    required: true,
    label: 'State'
  },
  'location.address.zipCode': {
    type:     Number,
    initial:  true,
    required: true,
    label: 'Zip Code'
  },
  'description': {
    type:     Types.Textarea,
    initial:  true,
    required: true    
  }
};

Pickup.add(fields);

Pickup.defaultColumns = 'title, location.name, day, time, location.type';
Pickup.register();