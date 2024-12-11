import Head from 'next/head'
import { useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import GraphqlClient from "../lib/graphql-client";

// const { getStandings } = require('./../stat-utils')
//
// exports = module.exports = async function (req, res) {
//   const view = new keystone.View(req, res)
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
// }

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
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta property="og:type" content="website" />
        <meta title="SFLUltimate" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="stylesheet" href="/styles/font-awesome/font-awesome.min.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Condensed:400,700|Roboto:300,400,400i,700" />
        <link rel="stylesheet" href="/styles/site.css" />
        <meta property="og:title" content="South Florida Ulitmate"/>
        <meta property="og:url" content="https://www.sflultimate.com/"/>
        <meta property="og:description" content="Since 1999, players from Miami & Ft. Lauderdale have united to promote grow the awesome sport of Ultimate Frisbee."/>
        <meta property="og:image" content="https://www.sflultimate.com/images/hatter-beach-ultimate.jpg"/>
      </Head>
      <div className="call-to-action" style={{ backgroundImage: 'url("/images/beach-ultimate-cover.jpg")' }}>
        <div className="video-full-screen">
          <video autoPlay={true} muted={true} loop={true}>
            <source src="https://d137pw2ndt5u9c.cloudfront.net/SFL_Community_Beach_Hatter_2019.mp4" type={'video/mp4'}/>
          </video>
        </div>
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h1>Welcome</h1>
              <p>Since 1999, players from Dade & Broward counties unite to grow the awesome sport of Ultimate Frisbee.
                if locals.league && locals.league.isRegistrationPeriod</p>
              if locals.league && locals.league.isRegistrationPeriod
              p Be sure to sign up for our locals.league.title
              else
              p We're working on our next league, while we wait go check out your local pick ups!
            </div>
          </div>
          <div className="row">
            <div className="col-md-12 text-center">
              {
                league ? <a href="/register" className="btn btn-lg btn-primary">Register</a> : <a href="/pickups" className="btn btn-lg btn-primary">Pick Ups</a>    
              }
            </div>
          </div>
        </div>
      </div>
      <div className="features">
        <div className="container">
          <h2 className="text-center">Why play South Florida Ultimate?</h2>
          <hr className="sfl-divider"/>
          <div className="row">
            <article className="col-sm-4 text-center"><i className="fa fa-smile-o fa-4x"></i>
              <h3>Community</h3>
              <p>From club athletes to newbies, league welcomes players of all skills & ability {JSON.stringify(league)}</p>
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

      <div className="container">
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
