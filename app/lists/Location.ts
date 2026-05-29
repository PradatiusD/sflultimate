const { Text, Url, Select, Float, Integer } = require('@keystonejs/fields')
const fields = {
  name: {
    type: Text,
    initial: true,
    required: true,
    index: true
  },
  slug: {
    type: Text,
    initial: true,
    isRequired: true
  },
  mapsLocationUrl: {
    type: Url
  },
  type: {
    type: Select,
    options: ['grass', 'turf', 'beach', 'indoor'],
    initial: true,
    isRequired: true,
    label: 'Field Type'
  },
  addressStreet: {
    type: Text,
    initial: true,
    isRequired: true,
    label: 'Street Address'
  },
  addressCity: {
    type: Text,
    initial: true,
    isRequired: true,
    label: 'City'
  },
  addressState: {
    type: Text,
    initial: true,
    isRequired: true,
    label: 'State'
  },
  addressZipCode: {
    type: Integer,
    initial: true,
    isRequired: true,
    label: 'Zip Code'
  },
  latitude: {
    type: Float,
    initial: false,
    isRequired: false,
    label: 'Latitude'
  },
  longitude: {
    type: Float,
    initial: false,
    isRequired: false,
    label: 'Longitude'
  }
}

module.exports = {
  fields,
  labelResolver: item => item.name,
  adminConfig: {
    defaultColumns: 'name'
  }
}
