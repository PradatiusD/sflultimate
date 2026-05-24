'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.default = void 0
const CustomDateTimeCell = function CustomDateTimeCell (props) {
  if (!props.data) {
    return null
  }
  return new Date(props.data).toLocaleString('en-US', {
    timeZone: 'America/New_York'
  })
}
const _default = exports.default = CustomDateTimeCell
