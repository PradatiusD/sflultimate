const keystone = require('keystone')

module.exports = function (req, res) {
  const view = new keystone.View(req, res)
  const locals = res.locals

  const sofia = {
    title: 'Sofia Whittaker',
    active: true,
    description: 'Sofia is a longtime local to South Florida, having played pickup as well as with Fiasco\'s Women\'s Ultimate Team.  She currently leads the organization as President and contributes as Treasurer.  When not playing frisbee you can catch her painting flowers or even doing accounting.',
    links: []
  }

  const prahasi = {
    title: 'Prahasi Kacham',
    active: true,
    description: 'Prahasi has been the social media strategist behind SFLUltimate, and has played with the Nova Southeastern University team, as well as with Fiasco, Fire Ultimate Team, among others.  She is a traveling adventurer.',
    links: []
  }

  const prada = {
    title: 'Daniel Prada',
    active: true,
    description: 'Prada has been playing from barefoot 2007, to college at Brown, a variety of club teams, pickup, beach and coached a youth team.  He developed this specific site, and has supported SFLUltimate in several capacities sine being involved in 2015.',
    links: []
  }

  locals.boardMembers = [
    sofia,
    prahasi,
    prada
  ]

  locals.positions = [
    {
      title: 'President',
      active: true,
      description: 'Sets agenda for organization, lays out yearly calendar, renews liability insurance, manages coordinators, leads drafts, communicates with captains, final decision maker.',
      commitment: 'Year-round',
      assigned: [sofia],
      links: [
        {
          url: '',
          label: 'Apply'
        }
      ]
    },
    {
      title: 'Treasurer',
      active: true,
      description: 'Books fields, estimates costs, reconciles registrations, orders jerseys and stickers.',
      commitment: 'Year-round',
      assigned: [sofia, prahasi],
      links: [
        {
          url: '',
          label: 'Apply'
        }
      ]
    },
    {
      title: 'Creative Director',
      active: true,
      description: 'Designs/produces social media posts, league jersey logos, logos for each team. Photographs key SFL Ultimate events, and if not available, coordinates photographers.',
      commitment: 'Year-round',
      assigned: [sofia, prahasi],
      links: [
        {
          url: '',
          label: 'Apply'
        }
      ]
    },
    {
      title: 'Secretary',
      active: true,
      description: 'Takes board meetings notes, drafts email/WhatsApp communications weekly for leagues.  Reply to player question emails/FB messages.  Assists with drafts.',
      commitment: 'Year-round',
      assigned: [prahasi],
      links: [
        {
          url: '',
          label: 'Apply'
        }
      ]
    },
    {
      title: 'Webmaster',
      active: true,
      description: 'Keeps the website up to date, responsible for site maintenance, handles new requests for changes.',
      commitment: 'Year-round',
      assigned: [prada],
      links: [
        {
          url: '',
          label: 'Apply'
        }
      ]
    },
    {
      title: 'Pick-Up Coordinators',
      active: true,
      description: 'Arrives early to games, sets up fields, prints and keeps track of stat sheets. .',
      commitment: 'Summer (June-August)',
      assigned: [prada],
      links: [
        {
          url: '',
          label: 'Apply'
        }
      ]
    },
    {
      title: 'Fall League Coordinator',
      active: true,
      description: 'Arrives early to games, sets up fields, prints and keeps track of stat sheets. ',
      commitment: 'Fall (November-December).',
      assigned: [prada],
      links: [
        {
          url: '',
          label: 'Apply'
        }
      ]
    },
    {
      title: 'Beach Coordinators',
      active: true,
      description: 'arrives early to games, sets up fields, assists with finals pavilion bbq social.',
      commitment: 'Summer (June-August)',
      assigned: [prada],
      links: [
        {
          url: '',
          label: 'Apply'
        }
      ]
    },
    {
      title: 'Spring League Coordinator',
      active: true,
      description: 'Arrives early to games, sets up fields, prints and keeps track of stat sheets. ',
      commitment: 'Spring (March-April)',
      assigned: [prada],
      links: [
        {
          url: '',
          label: 'Apply'
        }
      ]
    },
    {
      title: 'Youth Director',
      active: true,
      description: 'Assists with growing and mentoring youth',
      commitment: 'Spring (March-April)',
      assigned: [prada],
      links: [
        {
          url: '',
          label: 'Apply'
        }
      ]
    }
  ]

  view.render('board')
}
