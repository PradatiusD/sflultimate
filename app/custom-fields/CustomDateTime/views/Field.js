'use strict'

function _typeof (o) { '@babel/helpers - typeof'; return _typeof = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? function (o) { return typeof o } : function (o) { return o && typeof Symbol === 'function' && o.constructor === Symbol && o !== Symbol.prototype ? 'symbol' : typeof o }, _typeof(o) }
Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.default = void 0
const React = _interopRequireWildcard(require('react'))
const _fields = require('@arch-ui/fields')
const _dayPicker = require('@arch-ui/day-picker')
require('react-datetime-picker/dist/DateTimePicker.css')
require('react-calendar/dist/Calendar.css')
require('./index.css')
const _reactDatetimePicker = _interopRequireDefault(require('react-datetime-picker'))
function _interopRequireDefault (e) { return e && e.__esModule ? e : { default: e } }
function _getRequireWildcardCache (e) { if (typeof WeakMap !== 'function') return null; const r = new WeakMap(); const t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache (e) { return e ? t : r })(e) }
function _interopRequireWildcard (e, r) { if (!r && e && e.__esModule) return e; if (e === null || _typeof(e) != 'object' && typeof e !== 'function') return { default: e }; const t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); const n = { __proto__: null }; const a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (const u in e) if (u !== 'default' && {}.hasOwnProperty.call(e, u)) { const i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u] } return n.default = e, t && t.set(e, n), n }
const CustomDateTimeField = function CustomDateTimeField (_ref) {
  const autoFocus = _ref.autoFocus
  const field = _ref.field
  const _onChange = _ref.onChange
  const value = _ref.value
  const errors = _ref.errors
  const isDisabled = _ref.isDisabled
  const htmlID = 'ks-input-'.concat(field.path)
  console.log(value)
  return /* #__PURE__ */React.createElement(_fields.FieldContainer, null, /* #__PURE__ */React.createElement(_fields.FieldLabel, {
    htmlFor: htmlID,
    field,
    errors
  }), /* #__PURE__ */React.createElement(_fields.FieldDescription, {
    text: field.adminDoc
  }), /* #__PURE__ */React.createElement(_fields.FieldInput, null, /* #__PURE__ */React.createElement(_dayPicker.TextDayTimePicker, {
    style: {
      display: 'none'
    },
    id: htmlID,
    date: value,
    onChange: function onChange (e) {
      const t = new Date(e).toISOString()
      _onChange(t)
    },
    autoFocus,
    disabled: isDisabled
  }), /* #__PURE__ */React.createElement(_reactDatetimePicker.default, {
    id: htmlID,
    disableClock: true,
    onChange: function onChange (e) {
      const t = new Date(e).toISOString()
      _onChange(t)
    },
    isDisabled,
    value
  })))
}
const _default = exports.default = CustomDateTimeField
