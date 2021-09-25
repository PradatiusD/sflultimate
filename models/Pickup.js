const keystone = require('keystone')
const Types = keystone.Field.Types

/**
 * League Model
 * =============
 */

const Pickup = new keystone.List('Pickup', {
  map: { name: 'title' }
})

const fields = {
  title: {
    type: String,
    initial: true,
    required: true,
    index: true,
    label: 'Pickup Name'
  },
  day: {
    type: String,
    initial: true,
    required: true,
    label: 'Day(s) Played'
  },
  time: {
    type: String,
    initial: true,
    required: true,
    label: 'Start Time'
  },
  'contact.name': {
    type: String,
    initial: true
  },
  'contact.email': {
    type: Types.Email,
    initial: true
  },
  'contact.phone': {
    type: String,
    initial: true
  },
  'contact.url': {
    type: Types.Url,
    initial: true,
    label: 'Contact URL'
  },
  'location.name': {
    type: String,
    initial: true,
    required: true
  },
  'location.type': {
    type: Types.Select,
    options: ['grass', 'turf', 'beach', 'indoor'],
    initial: true,
    required: true,
    label: 'Field Type'
  },
  'location.address.street': {
    type: String,
    initial: true,
    required: true,
    label: 'Street Address'
  },
  'location.address.city': {
    type: String,
    initial: true,
    required: true,
    label: 'City'
  },
  'location.address.state': {
    type: String,
    initial: true,
    required: true,
    label: 'State'
  },
  'location.address.zipCode': {
    type: Number,
    initial: true,
    required: true,
    label: 'Zip Code'
  },
  'location.latitude': {
    type: Number,
    initial: false,
    required: false,
    label: 'Latitude'
  },
  'location.longitude': {
    type: Number,
    initial: false,
    required: false,
    label: 'Longitude'
  },
  description: {
    type: Types.Textarea,
    initial: true,
    required: true
  }
}

Pickup.add(fields)

Pickup.defaultColumns = 'title, location.name, day, time, location.type'
Pickup.register()
