import Head from 'next/head'
import { gql } from '@apollo/client'
import GraphqlClient from '../lib/graphql-client'
import { HeaderNavigation } from '../components/Navigation'
import Standings from '../components/Standings'
import { createSummary, showDate } from '../lib/utils'
import Image from 'next/image'

export const getServerSideProps = async (context) => {
  const host = context.req.headers.host
  if (host === 'beachbash.sflultimate.com') {
    return {
      redirect: {
        destination: 'https://www.sflultimate.com/beach-bash-tournament',
        permanent: false
      }
    }
  }

  const results = await GraphqlClient.query({
    query: gql`
      query {
        allLeagues(where: {isActive: true}) {
          id
          title
          slug
          summary
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
          registrationShareImage {
            publicUrl
          }
        }
        allPosts(sortBy: publishedDate_DESC, first: 3) {
          id
          title
          slug
          summary
          publishedDate
          image {
            publicUrl
          }
        }
        allEvents {
          id
          name
          slug
          summary
          category
          description
          startTime
          image {
            publicUrl
          }
        }
        allGames(where: {league: {isActive: true}}) {
          id
          homeTeam {
            id
            name
          }
          awayTeam {
            id
            name
          }
          homeTeamScore
          awayTeamScore
        }
      }`
  }, {
    variables: {}
  })

  const activeEvents = results.data.allEvents.filter(function (e) {
    return new Date(e.startTime).getTime() > Date.now()
  }).sort(function (a, b) {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  })

  return {
    props: {
      leagues: results.data.allLeagues,
      games: results.data.allGames,
      events: activeEvents,
      news: results.data.allPosts
    }
  }
}

export default function Homepage (props) {
  const { games, leagues, events, news } = props

  const keyTakeaways = getKeyTakeawaysData()
  keyTakeaways.pop()

  const leagueChampions = [
    'league-champions-2017-spring.jpg',
    'league-champions-2016-fall.jpg',
    'league-champions-2016-spring.jpg',
    'league-champions-2015-fall.jpg',
    'league-champions-2015-spring.jpg',
    'league-medals-2015-spring.jpg',
    'league-champions-2014-fall.jpg',
    'league-champions-2014-spring.jpg',
    'league-champions-2013-spring.jpg'
  ]

  const showSignupLeague = true

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
        <title>South Florida Ultimate: Pickups, Leagues, News & Events</title>
        <meta property="og:title" content="South Florida Ultimate: Pickups, Leagues, News & Events" />
        <meta property="og:url" content="https://www.sflultimate.com/"/>
        <meta property="og:type" content="website"/>
        <meta property="og:description" content="Since 1999, we organize & amplify the Ultimate Frisbee scene for Broward, Miami-Dade & Palm Beach." />
        <meta property="og:image" content="https://www.sflultimate.com/images/hatter-beach-ultimate.jpg"/>
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>
        <link rel="stylesheet" href="/styles/font-awesome/font-awesome.min.css"/>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Condensed:400,700|Roboto:300,400,400i,700"/>
        <link rel="stylesheet" href="/styles/site.css"/>
      </Head>
      <HeaderNavigation />
      {/* <div className="call-to-action" style={{height: '500px', backgroundImage: 'url("")'}}> */}
      {/* <div className="video-full-screen"> */}
      {/*  <video autoPlay={true} muted={true} loop={true}> */}
      {/*    <source src="https://d137pw2ndt5u9c.cloudfront.net/SFL_Community_Beach_Hatter_2019.mp4" type={'video/mp4'}/> */}
      {/*  </video> */}
      {/* </div> */}
      {/* </div> */}
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            {/*  if locals.league && locals.league.isRegistrationPeriod</p> */}
            {/* if locals.league && locals.league.isRegistrationPeriod */}
            {/* p Be sure to sign up for our locals.league.title */}
            {/* else */}
            {/* p We're working on our next league, while we wait go check out your local pick ups! */}
          </div>
        </div>
        {/* <div className="row"> */}
        {/*  <div className="col-md-12 text-center"> */}
        {/*    { */}
        {/*      league ? <a href="/register" className="btn btn-lg btn-primary">Register</a> : */}
        {/*        <a href="/pickups" className="btn btn-lg btn-primary">Pick Ups</a> */}
        {/*    } */}
        {/*  </div> */}
        {/* </div> */}
      </div>

      <div className="container">
        <div className="row">
          <div className="col-md-8">
            {
              !showSignupLeague && (
                <>
                  <h3>Latest Standings</h3>
                  <div className="standings">
                    <Standings games={games} />
                  </div>
                </>
              )
            }
            {
              showSignupLeague && (
                <>
                  <h3>Active Leagues</h3>
                  {
                    leagues.map((league) => {
                      const href = `/leagues/${league.slug}/register`
                      return (
                        <div key={league.id} style={{ marginBottom: '1rem' }}>
                          {
                            league.registrationShareImage && league.registrationShareImage.publicUrl && (
                              <a href={href}>
                                <Image className="img-fluid rounded " src={league.registrationShareImage.publicUrl} height={630} width={1200} />
                              </a>
                            )
                          }
                          <a href={href}><strong>{league.title}</strong></a>
                          <div dangerouslySetInnerHTML={{ __html: league.summary }}></div>
                        </div>
                      )
                    })
                  }
                </>
              )
            }
          </div>
          <div className="col-md-4">
            <h3>Upcoming Events</h3>
            {
              events.map((event) => {
                return (
                  <div key={event.id} className="homepage-news-card">
                    <div className="homepage-news-card-header">
                      <div>
                        {
                          event.image && event.image.publicUrl && (
                            <img className="img-fluid rounded-circle" src={event.image.publicUrl} style={{ aspectRatio: '1' }} />
                          )
                        }
                      </div>
                      <div>
                        <a href={'/events/' + event.slug}>
                          <strong>{event.name}</strong><br/>
                        </a>
                        <div>
                          <small className="text-muted">{event.category} • {showDate(event.startTime, { month: 'long', day: 'numeric', year: 'numeric', weekday: 'short' })}</small>
                        </div>
                      </div>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: createSummary(event, 140) }}></div>
                    <hr />
                  </div>
                )
              })
            }
          </div>
        </div>
        <div className="row">

          <h3>News</h3>
          {
            news.map((post) => {
              const href = '/news/' + post.slug
              return (
                <div key={post.id} className="homepage-news-card col-md-4">
                  {
                    post.image && post.image.publicUrl && (
                      <a href={href}>
                        <img className="img-fluid rounded" src={post.image.publicUrl} />
                      </a>
                    )
                  }
                  <a href={href}><strong>{post.title}</strong></a>
                  <div>
                    <small className="text-muted">{showDate(post.publishedDate, { month: 'long', day: 'numeric', year: 'numeric' })}</small>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: createSummary(post, 140) }}></div>
                </div>
              )
            })
          }
        </div>
      </div>

      {
        keyTakeaways.map((takeaway, index) => {
          const cssClass = 'key-takeaway ' + ((index % 2 === 0) ? 'left-layout' : 'right-layout')
          return (
            <section key={index} className={cssClass} style={{ backgroundImage: `url(${takeaway.image})` }}>
              <div>
                <h2>{takeaway.headline}</h2>
                <p>{takeaway.body}</p>
              </div>
            </section>
          )
        })
      }

      <div className="features">
        <div className="container">
          <h2 className="text-center">Why play South Florida Ultimate?</h2>
          <hr className="sfl-divider"/>
          <div className="row">
            <article className="col-sm-4 text-center"><i className="fa fa-smile-o fa-4x"></i>
              <h3>Community</h3>
              <p>From club athletes to newbies, league welcomes players of all skills & ability</p>
            </article>
            <article className="col-sm-4 text-center"><i className="fa fa-trophy fa-4x"></i>
              <h3>Play Ultimate</h3>
              <p>We have 8-10 regular season games and one final playoff tournament!</p>
            </article>
            <article className="col-sm-4 text-center"><i className="fa fa-female fa-4x"></i>
              <h3>Ladies Welcome</h3>
              <p>Our league is co-ed, and is always excited to invite new lady players!</p>
            </article>
          </div>
        </div>
      </div>

      <hr/>
      <section className="champions">
        <aside className="text-center">
          <h2>Hall of Fame</h2>
          <p>The past champions of South Florida</p>
        </aside>
        <div>
          {
            leagueChampions.map((championUrl, index) => {
              return <figure key={index} style={{ backgroundImage: 'url(/images/' + championUrl + ')' }}/>
            })
          }
        </div>
      </section>
    </>
  )
}

function getKeyTakeawaysData () {
  return [
    {
      headline: 'Welcome',
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/682db0ce069a32002858c125-frisbee_final-417-o.jpg',
      body: 'Since 1999, players from Dade & Broward counties unite to grow the awesome sport of Ultimate Frisbee.'
    },
    {
      headline: 'What is Ultimate?',
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/67bb625416cf0100287ff0a7-SFLUltimate_DFP-131-optimized.jpg',
      body: 'Ultimate is a fun, fast-paced team sport which combines the best elements of soccer, football and basketball as teams try to move the disc down field and score in their opponent’s end zone. This non-contact sport is self-refereed and has sportsmanship built into the rules via Spirit of the Game.'
    },
    {
      headline: 'The Field',
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/67bb626716cf0100287ff0c9-SFLUltimate_DFP-083-optimized.jpg',
      body: 'A rectangular shape with end zones at each end. A regulation field is 70 yards long by 40 yards wide, with end zones 20 yards deep.'
    },
    {
      headline: 'Starting Play',
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/67bbc6455bfcdf00289f599b-FBS05431-optimized.jpg',
      body: 'Each point begins with both teams lining up on the front of opposite end zone lines. The defense throws (“pulls”) the disc to the offense. A regulation game has seven players per team.'
    },
    {
      headline: 'Scoring',
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/67bbc39b5bfcdf00289f58c3-FBS05458-optimized.jpg',
      body: 'Each time the offense catches a pass in the defense’s end zone, the offense scores a point. The teams switch direction after every goal, and the next point begins with a new pull by the team that just scored.'
    },
    {
      headline: 'Movement of the Disc',
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/67bbc3735bfcdf00289f587f-FBS05149-optimized.jpg',
      body: 'The disc may be advanced in any direction by completing a pass to a teammate. Players may not run with the disc. The person with the disc (“thrower”) has ten seconds to throw the disc. The defender guarding the thrower (“marker”) counts out the stall count.'
    },
    {
      headline: 'Change of Possession',
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/67bbc3865bfcdf00289f58a1-IMG_9589-optimized.jpg',
      body: 'When a pass is not completed (e.g. out of bounds, drop, block, interception, stalled), the defense immediately takes possession of the disc and becomes the offense.'
    },
    {
      headline: 'Substitutions',
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/67bd11a189d0bc0028ae9e58-FBS05553-optimized.jpg',
      body: 'Players not in the game may replace players in the game after a score and during an injury timeout.'
    },
    {
      headline: 'Non-contact',
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/67bbc4815bfcdf00289f590e-FBS05086-optimized.jpg',
      body: 'Players must attempt to avoid physical contact during play. Picks and screens are also prohibited.'
    },
    {
      headline: 'Fouls',
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/67bbc3335bfcdf00289f5834-FBS05079-optimized.jpg',
      body: 'When a player initiates contact that affects the play, a foul occurs. When a foul causes a player to lose possession, the play resumes as if the possession was retained. If the player that the foul was called against disagrees with the foul call, the play is redone.'
    },
    {
      headline: 'Self - Officiating',
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/67bb621816cf0100287ff074-SFLUltimate_DFP-066-optimized.jpg',
      body: 'Players are responsible for their own foul and line calls. Players resolve their own disputes.'
    },
    {
      headline: 'Spirit of the game',
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/67bb623416cf0100287ff07e-SFLUltimate_DFP-146-optimized.jpg',
      body: 'The foundation of the rules in ultimate is Spirit of the Game, which places the responsibility for fair play on the player. Competitive play is encouraged, but never at the expense of respect between players, adherence to the rules, and the basic joy of play'
    },
    {
      headline: '10 Things to know about Spirit of the Game',
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/67bbc3605bfcdf00289f585d-FBS05553-optimized.jpg',
      body: `
    1. The golden rule: treat others as you would want to be treated. Spirited games result from mutual respect among opponents. Assume the best of your opponent. Give him or her the benefit of a doubt. You would want the same for yourself. But even if you are thick-skinned, do not assume that your opponent is.
    2. Control: SOTG takes real effort. SOTG is not just some abstract principle that everyone adopts and then games run smoothly without effort. Close calls are made in tight games. Hard fouls are committed. SOTG is about how you handle yourself under pressure: how you contain your emotion, tame your temper, and modulate your voice. If you initiate or contribute to the unraveling of spirit, the concept falls apart quickly. If you act to mend things (or at least not worsen the situation) by following (1) above, the game heals itself.
    3. Heckling and taunting are different. Ultimate has a long tradition of good-natured heckling. Heckles are friendly barbs, typically from non-playing spectators. Heckling can be fun, but taunting is un-spirited and wrong. Harassing remarks after an opponent's foul call or close play are NOT heckling: they are abusive taunts which create unpleasant playing conditions and often escalate to acrimonious disputes.
    4. SOTG is compatible with championship play. Competition and Spirit of the Game® complement each other and enhance the game. Time and again, great teams and star players have shown that you can bring all your competitive and athletic zeal to a game without sacrificing fair play or respect for your opponent.
    5. Don't "give as you got." There is no "eye for an eye." If you are wronged, you have no right to wrong someone in return. In the extreme case where you were severely mistreated, you may bring the issue up with a captain, tournament director, or even lodge a complaint with the governing body. If you retaliate in kind, however, a complaint may be filed against you. We recall point (1): treat others as you would have them treat you, not as they have treated you. In the end, you are responsible for you.
    6. Breathe. After a hard foul, close call, or disputed play, take a step back, pause, and take a deep breath. In the heat of competition, emotions run high. By giving yourself just a bit of time and space, you will gain enough perspective to compose yourself and concentrate on the facts involved in the dispute (was she in or out; did you hit his hand or the disc; did that pick affect the play). Your restraint will induce a more restrained response from your opponent. Conflagration averted, you may resume business as usual.
    7. When you do the right thing, people notice. When you turn the other cheek, you you've done the right thing. You may not hear praise, there may be no standing ovation, but people do notice. Eventually, their respect for you and their appreciation of the game will grow.
    8. Be generous with praise. Compliment an opponent on her good catch. Remark to a teammate that you admire his honesty in calling himself out of bounds. Look players in the eye and congratulate them when you shake their hands after a game. These small acts boost spirit greatly, a large payoff for little time and effort.
    9. Impressions linger. Not only does the realization that your actions will be remembered for a long time serve to curb poor behavior, it can also inspire better conduct. Many old-timers enjoy the experience of meeting an elite player who remembers their first rendezvous on the field and recalls the event in detail. A good first encounter with an impressionable young player can have considerable long term positive impact.
    10. Have fun. All other things being equal, games are far more fun without the antipathy. Go hard. Play fair. Have fun.`
    }
  ]
}
