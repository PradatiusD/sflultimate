const CustomDateTimeCell = props => {
  if (!props.data) {
    return null
  }
  return new Date(props.data).toLocaleString('en-US', { timeZone: 'America/New_York' })
}

export default CustomDateTimeCell
