import Head from 'next/head'
import { useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import GraphqlClient from "../lib/graphql-client";

// const { getStandings } = require('./../stat-utils')
//
//   const locals = res.locals
//
//   const currentLeague = res.locals.league ? res.locals.league : null
//
//   locals.standings = await getStandings({
//     currentLeague
//   })
//
//   locals.hallOfFameImages =
//   if (req.query.f === 'json') {
//     res.json(locals.standings)
//     return
//   }

export const getServerSideProps = (async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allLeagues(where: {isActive: true}) {
          title
        }
      }`,
  });
  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  return { props: {league}}
})

export default function Homepage (props) {
  const keyTakeaways = [
    {
      headline: 'Welcome',
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/67bb4abfd29eaf002866628c-IMG_4660.jpg',
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
      image: 'https://d137pw2ndt5u9c.cloudfront.net/keystone/67bb631516cf0100287ff10d-20240218_132137-optimized.jpg',
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
  
  keyTakeaways.pop()


  const {league} = props
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

  return (
    <div>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
        <meta property="og:type" content="website"/>
        <title>South Florida Ultimate</title>
        <meta property="og:title" content="South Florida Ulitmate"/>
        <meta property="og:url" content="https://www.sflultimate.com/"/>
        <meta property="og:description"
              content="Since 1999, players from Miami & Ft. Lauderdale have united to promote grow the awesome sport of Ultimate Frisbee."/>
        <meta property="og:image" content="https://www.sflultimate.com/images/hatter-beach-ultimate.jpg"/>
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>
        <link rel="stylesheet" href="/styles/font-awesome/font-awesome.min.css"/>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Condensed:400,700|Roboto:300,400,400i,700"/>
        <link rel="stylesheet" href="/styles/site.css"/>

      </Head>
      {/*<div className="call-to-action" style={{height: '500px', backgroundImage: 'url("")'}}>*/}
      {/*<div className="video-full-screen">*/}
      {/*  <video autoPlay={true} muted={true} loop={true}>*/}
        {/*    <source src="https://d137pw2ndt5u9c.cloudfront.net/SFL_Community_Beach_Hatter_2019.mp4" type={'video/mp4'}/>*/}
        {/*  </video>*/}
        {/*</div>*/}
      {/*</div>*/}
      <div className="container">
        <div className="row">
          <div className="col-md-12">
              {/*  if locals.league && locals.league.isRegistrationPeriod</p>*/}
              {/*if locals.league && locals.league.isRegistrationPeriod*/}
              {/*p Be sure to sign up for our locals.league.title*/}
              {/*else*/}
              {/*p We're working on our next league, while we wait go check out your local pick ups!*/}
          </div>
        </div>
        {/*<div className="row">*/}
        {/*  <div className="col-md-12 text-center">*/}
        {/*    {*/}
        {/*      league ? <a href="/register" className="btn btn-lg btn-primary">Register</a> :*/}
        {/*        <a href="/pickups" className="btn btn-lg btn-primary">Pick Ups</a>*/}
        {/*    }*/}
        {/*  </div>*/}
        {/*</div>*/}
      </div>

      {
        keyTakeaways.map((takeaway, index) => {
          const cssClass = "key-takeaway " + ((index % 2 === 0) ? 'left-layout': 'right-layout') 
          return (
            <section key={index} className={cssClass} style={{backgroundImage: `url(${takeaway.image})`}}>
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

      <div className="container" style={{display: "none"}}>
        <div className="row">
          <div className="col-md-12">
            <h3>Current Standings</h3>
            <p>Here you can see the current standings for the current league!</p>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div>
              <table className="table table-striped table-bordered text-center">
                <thead>
                <tr>
                  <th className="text-center">Name</th>
                  <th className="text-center">Wins</th>
                  <th className="text-center">Losses</th>
                  <th className="text-center">Forfeits</th>
                  <th className="text-center">Points Scored</th>
                  <th className="text-center">Points Allowed</th>
                  <th className="text-center">Avg. Points Scored</th>
                  <th className="text-center">Avg. Points Allowed</th>
                  <th className="text-center">Point Differential</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                  <td className="text-left">=team.name</td>
                  <td>=team.wins</td>
                  <td>=team.losses</td>
                  <td>=team.forfeits</td>
                  <td>=team.pointsScored</td>
                  <td>=team.pointsAllowed</td>
                  <td>=team.avgPointsScoredPerGame</td>
                  <td>=team.avgPointsAllowedPerGame</td>
                  <td>=team.pointDiff</td>
                </tr>
                </tbody>
              </table>
              <p>
                <em>Note: If one team forfeits, the opponent gets the equivalent of 13-0 game. If two teams playing
                  each other forfeit, each takes a loss and a -13 hit to point differential.</em>
              </p>
            </div>
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
              return <figure key={index} style={{backgroundImage: 'url(/images/' + championUrl + ')'}}/>
            })
          }
        </div>
      </section>
    </div>
  )
}
