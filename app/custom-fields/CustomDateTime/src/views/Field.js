import * as React from 'react'
import { FieldContainer, FieldLabel, FieldDescription, FieldInput } from '@arch-ui/fields'
import { TextDayTimePicker } from '@arch-ui/day-picker'
import 'react-datetime-picker/dist/DateTimePicker.css'
import 'react-calendar/dist/Calendar.css'
import './index.css'
import DateTimePicker from 'react-datetime-picker'

const CustomDateTimeField = ({ autoFocus, field, onChange, value, errors, isDisabled }) => {
  const htmlID = `ks-input-${field.path}`
  console.log(value)
  return (
    <FieldContainer>
      <FieldLabel htmlFor={htmlID} field={field} errors={errors} />
      <FieldDescription text={field.adminDoc} />
      <FieldInput>
        <TextDayTimePicker
          style={{ display: 'none' }}
          id={htmlID}
          date={value}
          onChange={(e) => {
            const t = new Date(e).toISOString()
            onChange(t)
          }}
          autoFocus={autoFocus}
          disabled={isDisabled}
        />
        <DateTimePicker
          id={htmlID}
          disableClock
          onChange={(e) => {
            const t = new Date(e).toISOString()
            onChange(t)
          }}
          isDisabled={isDisabled}
          value={value} />
      </FieldInput>
    </FieldContainer>
  )
}

export default CustomDateTimeField
