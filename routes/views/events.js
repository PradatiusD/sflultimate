const keystone = require('keystone')

module.exports = function (req, res) {
  const view = new keystone.View(req, res)

  res.locals.events = [
    {
      title: 'UMiami Halloweekend Ultimate Hatter',
      category: 'Hatter - October 29th - 10am-2pm - Intramural Fields at the University of Miami',
      active: true,
      description: 'We are sure you had a great time last spring and we cannot wait to see you on October 29th showing your support for the Women’s Ultimate Team here at UM. This fall, the hatter is going to be held on Halloweekend! So it will be Halloween themed :) Registration is $20, $15 dollars for UM Students, and will be collected on October 29th at the tournament. We will be taking Cash or Venmo.',
      image: null,
      links: [
        {
          url: 'https://docs.google.com/forms/d/e/1FAIpQLSeUGJtCYOO-mOx5lCen-w6gJC5tQN9v7bU6_UpbcUPN5cblUw/viewform',
          label: 'Registration link'
        }
      ]
    }
  ]

  view.render('events')
}
