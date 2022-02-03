const keystone = require('keystone')

module.exports = function (req, res) {
  const view = new keystone.View(req, res)
  const locals = res.locals

  locals.clubTeams = [
    {
      title: 'El Niño',
      category: 'Open',
      description: 'El Niño Ultimate is a high-level open club team based out of Oakland Park, Florida. In 2018, they were Florida Section Champions and in 2018 placed 5th at the USAU South East Regional Championships.',
      image: '/images/teams/el-nino.jpg',
      links: [
        {
          url: 'https://www.facebook.com/oaklandparkelnino/',
          label: 'Facebook Page'
        },
        {
          url: 'http://www.elninoultimate.com',
          label: 'Website'
        },
        {
          url: 'https://twitter.com/ElNinoUltimate',
          label: 'Twitter Page'
        },
        {
          url: 'https://www.instagram.com/elninoultimate/',
          label: 'Instagram Page'
        }
      ]
    },
    {
      title: 'Fiasco',
      category: 'Women',
      description: 'Fiasco is a high-level women\'s club team based in Broward and Dade counties. Fiasco\'s next tryout is Sunday, May 19 from 12-3 in Biscayne Park at the Ed Burke Recreation Center.',
      image: '/images/teams/fiasco.jpg',
      links: [
        {
          url: 'https://www.facebook.com/fiascoultimate/',
          label: 'Facebook Page'
        },
        {
          url: 'https://www.instagram.com/fiascoultimate/',
          label: 'Instagram Page'
        },
        {
          url: 'https://twitter.com/FiascoUltimate',
          label: 'Twitter Page'
        }
      ]
    },
    {
      title: 'Fire Miami Ultimate',
      category: 'Mixed',
      description: 'Fire Miami Ultimate is a new mixed club ultimate team based in South Florida. This team was originated in Colombia and in 2019 started its process to form a presence here in South Florida.',
      image: '/images/teams/fire-ultimate-dark.png',
      links: [
        {
          url: 'https://www.facebook.com/FireUltimateClub/',
          label: 'Facebook Page'
        },
        {
          url: 'https://www.instagram.com/fireultimateclub_oficial/',
          label: 'Instagram Page'
        }
      ]
    },
    {
      title: 'Mixchief',
      category: 'Mixed',
      description: 'Mixchief, is a second year club mixed ultimate team based in West Palm Beach with team members from all across the state.',
      image: '/images/teams/mixchief.jpg',
      links: [
        {
          url: 'https://www.instagram.com/mixchief.wpb/',
          label: 'Instagram Page'
        },
        {
          url: 'https://twitter.com/Mixchief_WPB',
          label: 'Twitter Page'
        }
      ]
    },
    {
      title: 'South Side',
      category: 'Open',
      description: 'The newly formed South Side men\'s ultimate team won the 2022 Janus XXVII Open Championship with a 6 - 0 record finishing finals 11 - 7.',
      image: '/images/teams/southside.jpg',
      links: [
        {
          url: 'https://www.instagram.com/davidap17/',
          label: 'Instagram Page'
        }
      ]
    }
  ]

  view.render('club-teams')
}
