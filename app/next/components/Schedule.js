import { addLeagueToVariables, showDate, showHourMinute, showWeekday } from '../lib/utils'
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
          name
          showNameOnSchedule
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
    variables
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
            <div className="table-responsive">
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
                    const game = gameOrEvent.__typename === 'Game' ? gameOrEvent : null
                    const event = !game ? gameOrEvent : null
                    if (game) {
                      const inPast = new Date(gameOrEvent.scheduledTime).getTime() < Date.now()
                      const hasTeams = gameOrEvent.homeTeam && gameOrEvent.awayTeam
                      const showGameName = gameOrEvent.showNameOnSchedule || !hasTeams
                      return (
                        <tr key={game.id} className={inPast ? 'text-muted' : ''}>
                          <td>{showDate(game.scheduledTime)}</td>
                          <td>{showWeekday(game.scheduledTime)}</td>
                          <td>{showHourMinute(game.scheduledTime)}</td>
                          <td>
                            {
                              showGameName && <div>{game.name}</div>
                            }
                            {
                              hasTeams && (
                                <div>
                                  <span style={{ borderBottom: '3px solid ' + game.homeTeam.color }}>{game.homeTeam.name}</span>
                                    {' '}vs.{' '}
                                  <span style={{ borderBottom: '3px solid ' + game.awayTeam.color }}>{game.awayTeam.name}</span>
                                </div>
                              )
                            }
                            {
                              (game.homeTeamScore > 0 || game.awayTeamScore > 0) && (!game.homeTeamForfeit && !game.homeTeamForfeit) && (
                                <span> ({game.homeTeamScore}-{game.awayTeamScore})</span>
                              )
                            }
                            {
                              game.homeTeamForfeit && (
                                <span>
                                  <br/> {game.homeTeam.name} forfeited
                                </span>
                              )
                            }
                            {
                              game.awayTeamForfeit && (
                                <span>
                                  <br/> {game.awayTeam.name} forfeited
                                </span>
                              )
                            }
                          </td>
                          <td>{game?.location?.name}</td>
                          <td>
                            <a href={'/games/' + game.id}>
                              {new Date(game.scheduledTime).getTime() < Date.now() ? 'Recap' : 'Preview'}
                            </a>
                          </td>
                        </tr>
                      )
                    }
                    return (
                      <tr key={event.id}>
                        <td>{showDate(event.startTime)}</td>
                        <td>{showWeekday(event.startTime)}</td>
                        <td>{showHourMinute(event.startTime)}</td>
                        <td><span className="badge">Event</span> {event.name}</td>
                        <td>{event.location}</td>
                        <td><a target="_blank" href={event.moreInformationUrl}>More Information</a></td>
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
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
