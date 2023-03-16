const keystone = require('keystone')

module.exports = function (req, res) {
  const view = new keystone.View(req, res)
  res.locals.events = [
    {
      title: 'Beach Ultimate Hatter',
      category: 'Hatter',
      start_time: '2023-04-01T14:00:00.000Z',
      end_time: '2023-04-01T18:00:00.000Z',
      location: 'Ft. Lauderdale Beach',
      description: 'Our newest flyer just dropped for the upcoming Fiasco hatter (🥵) on Saturday, April 1st! I wanted to share and send a friendly little reminder if you were interested in playing with us again! =] We hope to see you in your best dancing/rave gear! (theme optional, of course, just come play if you want!) You can register here, and we\'re always available for questions!',
      image: null,
      links: [
        {
          url: 'https://forms.gle/XtNRSm8QvhncTZo98',
          label: 'Register'
        }
      ]
    },
    {
      title: 'UMiami Halloweekend Ultimate Hatter',
      category: 'Hatter',
      start_time: '2022-10-29T14:00:00.000Z',
      end_time: '2022-10-29T18:00:00.000Z',
      location: 'University of Miami Intramural Fields',
      description: 'We are sure you had a great time last spring and we cannot wait to see you on October 29th showing your support for the Women’s Ultimate Team here at UM. This fall, the hatter is going to be held on Halloweekend! So it will be Halloween themed :) Registration is $20, $15 dollars for UM Students, and will be collected on October 29th at the tournament. We will be taking Cash or Venmo.',
      image: null,
      links: [
        {
          url: 'https://docs.google.com/forms/d/e/1FAIpQLSeUGJtCYOO-mOx5lCen-w6gJC5tQN9v7bU6_UpbcUPN5cblUw/viewform',
          label: 'Register'
        }
      ]
    },
    {
      title: 'Salute Hatter',
      category: 'Hatter',
      start_time: '2022-11-13T14:00:00.000Z',
      end_time: '2022-11-13T20:00:00.000Z',
      location: 'Continental Park',
      description: '1.5 hour games. Coed teams. Quantity of teams and gender ratio will be determined by number of people who sign up. $20 per player.',
      image: null,
      links: [
        {
          url: 'https://docs.google.com/forms/d/e/1FAIpQLSc1ZYQ1HccZFzLTVh8YRoiiMGOMW5_FKVvo4zF8u_17H3tJ8Q/viewform',
          label: 'Register'
        }
      ]
    }
  ].map(function (event) {
    event.active = new Date().toISOString() < event.start_time
    event.start_time_formatted = new Date(event.start_time).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      timeZone: 'America/New_York'
    })

      return event
  })


  view.render('events')
}
