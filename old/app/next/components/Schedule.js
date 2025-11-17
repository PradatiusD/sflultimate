import {addLeagueToVariables, showDate, showHourMinute, showWeekday} from '../lib/utils'
import { useState } from 'react'
import GraphqlClient from '../lib/graphql-client'
import { gql } from '@apollo/client'
import LeagueUtils from '../lib/league-utils'

export const getScheduleData = async function (context) {
  const variables = addLeagueToVariables(context, {})
  const results = await GraphqlClient.query({
    query: gql`
      query($leagueCriteria: LeagueWhereInput) {
        allLeagues(where: $leagueCriteria) {
          id
          title
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
          finalsTournamentDescription
          finalsTournamentEndDate
          finalsTournamentStartDate
          finalsTournamentLocation {
            name
          }
        }
        allGames(where: {league: $leagueCriteria}, sortBy: scheduledTime_ASC) {
          id
          scheduledTime
          homeTeam {
            name
            color
          }
          homeTeamScore
          homeTeamForfeit
          awayTeam {
            name
            color
          }
          awayTeamScore
          awayTeamForfeit
          location {
            name
          }
          __typename
        }
        allEvents {
          id
          startTime
          name
          location
          moreInformationUrl
          __typename
        }
        allTeams(where: {league: $leagueCriteria}) {
          id
          color
        }
      }`,
    variables: variables
  })
  const league = results.data.allLeagues[0]
  const games = Array.from(results.data.allGames).sort((a, b) => {
    return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
  })
  const teams = results.data.allTeams
  const events = results.data.allEvents.filter(event => event.startTime && new Date(event.startTime).getTime() > Date.now())
  LeagueUtils.addLeagueStatus(league)
  return { league, games, teams, events }
}

export const Schedule = function (props) {
  const { league, games, teams, events } = props

  const finalsStartDate = league.finalsTournamentStartDate && new Date(league.finalsTournamentStartDate)

  const gamesAndEvents = games.concat(events)
  gamesAndEvents.sort((a, b) => {
    return new Date(a.startTime || a.scheduledTime).getTime() - new Date(b.startTime || b.scheduledTime).getTime()
  })
  const [activeGames, setActiveGames] = useState(gamesAndEvents)
  return (
    <>
      <div className="container">
        <div className="schedule">
          <section>
            <h1>{league.title} Schedule</h1>
            <p className="lead">
              Pick your color to filter schedule by your team.<br/>
              {
                teams.map(team => {
                  return (
                    <span
                      className="team-color"
                      key={team.id}
                      style={{ backgroundColor: team.color }}
                      onClick={() => {
                        const filteredList = games.filter((game) => {
                          return game.homeTeam.color === team.color || game.awayTeam.color === team.color
                        })
                        setActiveGames(filteredList)
                      }}
                    ></span>
                  )
                })
              }

            </p>
            <table className="table table-striped table-bordered">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weekday</th>
                  <th>Time</th>
                  <th>Matchup / Event Name</th>
                  <th>Field</th>
                  <th>Preview/Recap</th>
                </tr>
              </thead>
              <tbody>
                {
                  activeGames.map((gameOrEvent) => {
                    if (gameOrEvent.__typename === 'Game') {
                      const inPast = new Date(gameOrEvent.scheduledTime).getTime() < Date.now()
                      return (
                        <tr key={gameOrEvent.id} className={inPast ? 'text-muted' : ''}>
                          {

                          }
                          <td>{showDate(gameOrEvent.scheduledTime)}</td>
                          <td>{showWeekday(gameOrEvent.scheduledTime)}</td>
                          <td>{showHourMinute(gameOrEvent.scheduledTime)}</td>
                          <td>
                            <span><span
                              style={{ borderBottom: '3px solid ' + gameOrEvent.homeTeam.color }}>{gameOrEvent.homeTeam.name}</span> vs. <span
                              style={{ borderBottom: '3px solid ' + gameOrEvent.awayTeam.color }}>{gameOrEvent.awayTeam.name}</span></span>
                            {
                              (gameOrEvent.homeTeamScore > 0 || gameOrEvent.awayTeamScore > 0) && (!gameOrEvent.homeTeamForfeit && !gameOrEvent.homeTeamForfeit) && (
                                <span> ({gameOrEvent.homeTeamScore}-{gameOrEvent.awayTeamScore})</span>
                              )
                            }
                            {
                              gameOrEvent.homeTeamForfeit && (
                                <span>
                                  <br/> {gameOrEvent.homeTeam.name} forfeited
                                </span>
                              )
                            }
                            {
                              gameOrEvent.awayTeamForfeit && (
                                <span>
                                  <br/> {gameOrEvent.awayTeam.name} forfeited
                                </span>
                              )
                            }
                          </td>
                          <td>{gameOrEvent?.location?.name}</td>
                          <td>
                            <a href={'/games/' + gameOrEvent.id}>
                              {new Date(gameOrEvent.scheduledTime).getTime() < Date.now() ? 'Recap' : 'Preview'}
                            </a>
                          </td>
                        </tr>
                      )
                    }
                    return (
                      <tr key={gameOrEvent.id}>
                        <td>{showDate(gameOrEvent.startTime)}</td>
                        <td>{showHourMinute(gameOrEvent.startTime)}</td>
                        <td colSpan={2}><span className="badge">Event</span> {gameOrEvent.name}</td>
                        <td>{gameOrEvent.location}</td>
                        <td><a target="_blank" href={gameOrEvent.moreInformationUrl}>More Information</a></td>
                      </tr>
                    )
                  })
                }
                {
                  finalsStartDate && (
                    <tr>
                      <td>{showDate(finalsStartDate)}</td>
                      <td></td>
                      <td>{showHourMinute(finalsStartDate)} - {showHourMinute(league.finalsTournamentEndDate)}</td>
                      <td style={{ maxWidth: '529px' }} dangerouslySetInnerHTML={{ __html: league.finalsTournamentDescription }}></td>
                      <td>{league.finalsTournamentLocation?.name}</td>
                    </tr>
                  )
                }
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </>
  )
}
