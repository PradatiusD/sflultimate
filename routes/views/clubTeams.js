const keystone = require('keystone')

module.exports = function (req, res) {
  const view = new keystone.View(req, res)
  const locals = res.locals

  locals.clubTeams = [
    {
      title: 'El Niño',
      category: 'Open',
      active: true,
      description: 'El Niño Ultimate is a high-level open club team based out of Oakland Park, Florida. In 2018, 2022 they were Florida Section Champions and in 2018 placed 5th at the USAU South East Regional Championships.',
      image: '/images/teams/el-nino.jpg',
      links: [
        {
          url: 'https://www.instagram.com/elninoultimate/',
          label: 'Instagram Page'
        },
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
          url: 'https://docs.google.com/forms/d/e/1FAIpQLSeuuwgfvcXFYxzYpYRgzrnLfXyKR1QmrbVmDopWbJJw8F1cKQ/viewform',
          label: 'Interest Form'
        }
      ]
    },
    {
      title: 'Fiasco',
      category: 'Women',
      active: true,
      description: 'Fiasco is a high-level women\'s club team based in Broward and Dade counties.',
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
      title: 'Rocket',
      category: 'Mixed',
      active: true,
      description: 'Mixed Ultimate Team based out of South Florida 🥏🏝️.  Feel the Boom 🚀',
      image: '/images/teams/rocket.jpg',
      links: [
        {
          url: 'https://www.instagram.com/rocket.booom/',
          label: 'Instagram Page'
        },
        {
          url: 'https://docs.google.com/forms/d/e/1FAIpQLSf7K2lCNCNtHQszBOrXHQDzVM2Stkwl9unMt-as9-IsWc1x1g/viewform',
          label: 'Interest Form'
        },
        {
          url: 'https://www.facebook.com/profile.php?id=100090472785740',
          label: 'Facebook Page'
        }
      ]
    },
    {
      title: 'Fire Miami Ultimate',
      category: 'Mixed',
      active: false,
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
      active: false,
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
      active: true,
      description: 'The newly formed South Side men\'s ultimate team won the 2022 Janus XXVII Open Championship and placed 3rd at Sectionals in 2022.',
      image: '/images/teams/southside.jpg',
      links: [
        {
          url: 'https://www.instagram.com/southsideultimate/',
          label: 'Instagram Page'
        }
      ]
    },
    {
      title: 'University of Miami Womxn’s Ultimate Frisbee',
      category: 'College - Women',
      active: true,
      description: 'Practice: Mon & Wed 6:30 - 9:00 Sun 12:00-2:30',
      image: null,
      links: [
        {
          url: 'https://www.instagram.com/umiamiwomensultimate/',
          label: 'Instagram Page'
        }
      ]
    },
    {
      title: 'University of Miami Men’s Ultimate Frisbee',
      category: 'College - Men',
      active: true,
      description: 'Direct message on instagram for more questions',
      image: null,
      links: [
        {
          url: 'https://www.instagram.com/umiamimensultimate/',
          label: 'Instagram Page'
        }
      ]
    },
    {
      title: 'Nova Southeastern University',
      category: 'College - Mixed',
      active: true,
      description: 'Competitive co-ed Ultimate Frisbee club team based out of Nova Southeastern University!\n',
      image: null,
      links: [
        {
          url: 'https://www.instagram.com/sharks_ultimate/',
          label: 'Instagram Page'
        }
      ]
    }
  ]

  view.render('club-teams')
}
