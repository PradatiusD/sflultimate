"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var React = _interopRequireWildcard(require("react"));
var _fields = require("@arch-ui/fields");
var _dayPicker = require("@arch-ui/day-picker");
require("react-datetime-picker/dist/DateTimePicker.css");
require("react-calendar/dist/Calendar.css");
require("./index.css");
var _reactDatetimePicker = _interopRequireDefault(require("react-datetime-picker"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n["default"] = e, t && t.set(e, n), n; }
var CustomDateTimeField = function CustomDateTimeField(_ref) {
  var autoFocus = _ref.autoFocus,
    field = _ref.field,
    _onChange = _ref.onChange,
    value = _ref.value,
    errors = _ref.errors,
    isDisabled = _ref.isDisabled;
  var htmlID = "ks-input-".concat(field.path);
  console.log(value);
  return /*#__PURE__*/React.createElement(_fields.FieldContainer, null, /*#__PURE__*/React.createElement(_fields.FieldLabel, {
    htmlFor: htmlID,
    field: field,
    errors: errors
  }), /*#__PURE__*/React.createElement(_fields.FieldDescription, {
    text: field.adminDoc
  }), /*#__PURE__*/React.createElement(_fields.FieldInput, null, /*#__PURE__*/React.createElement(_dayPicker.TextDayTimePicker, {
    style: {
      display: 'none'
    },
    id: htmlID,
    date: value,
    onChange: function onChange(e) {
      var t = new Date(e).toISOString();
      _onChange(t);
    },
    autoFocus: autoFocus,
    disabled: isDisabled
  }), /*#__PURE__*/React.createElement(_reactDatetimePicker["default"], {
    id: htmlID,
    disableClock: true,
    onChange: function onChange(e) {
      var t = new Date(e).toISOString();
      _onChange(t);
    },
    isDisabled: isDisabled,
    value: value
  })));
};
var _default = exports["default"] = CustomDateTimeField;