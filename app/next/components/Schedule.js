import { showDate, showHourMinute, showWeekday } from '../lib/utils'
import { useState } from 'react'
import { buildTeamUrl } from '../lib/team-utils'
import { buildGameUrl } from '../lib/game-url'

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
                  <th>Location</th>
                  <th>Preview/Recap</th>
                </tr>
                </thead>
                <tbody style={{ whiteSpace: 'nowrap' }}>
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
                                  <a href={buildTeamUrl(league, game.homeTeam)} style={{ borderBottom: '3px solid ' + game.homeTeam.color }}>
                                    {game.homeTeam.name}
                                  </a>
                                    {' '}vs.{' '}
                                  <a href={buildTeamUrl(league, game.awayTeam)} style={{ borderBottom: '3px solid ' + game.awayTeam.color }}>
                                    {game.awayTeam.name}
                                  </a>
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
                                  <br/> <a href={buildTeamUrl(league, game.homeTeam)}>{game.homeTeam.name}</a> forfeited
                                </span>
                              )
                            }
                            {
                              game.awayTeamForfeit && (
                                <span>
                                  <br/> <a href={buildTeamUrl(league, game.awayTeam)}>{game.awayTeam.name}</a> forfeited
                                </span>
                              )
                            }
                          </td>
                          <td>
                            {
                              game.location?.mapsLocationUrl && (
                                <a href={game.location.mapsLocationUrl} target="_blank" rel="noopener noreferrer">
                                  {game?.location?.name}
                                </a>
                              )
                            }
                            {
                              !game.location?.mapsLocationUrl && (
                                <span>{game?.location?.name}</span>
                              )
                            }
                          </td>
                          <td>
                            <a href={buildGameUrl(league, game)}>
                              {new Date(game.scheduledTime).getTime() < Date.now() ? 'Recap' : 'Preview'}
                            </a>
                          </td>
                        </tr>
                      )
                    }

                    const eventUrl = '/events/' + event.slug
                    return (
                      <tr key={event.id} style={{ verticalAlign: 'middle' }}>
                        <td>{showDate(event.startTime)}</td>
                        <td>{showWeekday(event.startTime)}</td>
                        <td>{showHourMinute(event.startTime)}</td>
                        <td>
                          <div className="d-flex">
                            {
                              event.image && (
                                <a href={eventUrl} target="_blank">
                                  <img className="rounded-circle me-2" src={event.image.publicUrl} alt={event.name + ' image'} style={{ width: '50px', height: '50px', objectFit: 'cover', display: 'inline' }} />
                                </a>
                              )
                            }
                            <div className="d-inline">
                              <span className="badge text-bg-primary">{event.category || 'Event'}</span><br/>
                              <a href={eventUrl} target="_blank">
                                {event.name}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td>{event.location}</td>
                        <td><a target="_blank" href={eventUrl}>More Information</a></td>
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
