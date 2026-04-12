export function notify (msg) {
  const webhookUrl = process.env.SLACK_NOTIFICATION_WEBHOOK
  if (!webhookUrl) {
    return console.error('No webhook URL provided')
  }
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: msg
    })
  }
  fetch(webhookUrl, requestOptions).catch(err => {
    console.log(err)
  })
}
