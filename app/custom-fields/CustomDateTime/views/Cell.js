"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var CustomDateTimeCell = function CustomDateTimeCell(props) {
  if (!props.data) {
    return null;
  }
  return new Date(props.data).toLocaleString('en-US', {
    timeZone: 'America/New_York'
  });
};
var _default = exports["default"] = CustomDateTimeCell;