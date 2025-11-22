import 'add-to-calendar-button'

export function AddToCalendar (props) {
  const { event } = props
  return (
    <add-to-calendar-button
      name={event.name}
      buttonStyle="simple"
      description={event.description}
      startDate={event.startTime}
      endDate={event.endTime}
      location={event.location}
      hideBackground={false}
      styleLight={'--btn-border: #ccc;--font:"Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif;--btn-border-radius: 3px; --btn-padding-y: .65em; --btn-padding-x: .65em; --btn-font-weight: 400;--base-font-size-l: 17px;--base-font-size-m: 17px;--base-font-size-s: 17px;'}
      options="['Apple','Google','iCal','Microsoft365','Outlook.com','Yahoo']"
      timeZone="UTC"
      trigger="click"
      inline
      listStyle="dropdown"
      iCalFileName="Reminder-Event"
    />
  )
}
