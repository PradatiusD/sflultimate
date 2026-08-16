import { HeaderNavigation } from './Navigation'
import { showDate, showHourMinute } from '../lib/utils'
import Standings from './Standings'
import { PlayerLink } from './PlayerLink'
import GameStatTable from './GameStatTable'
import { buildTeamUrl } from '../lib/team-utils'
import { buildGameUrl } from '../lib/game-utils'
import SeoHead from './SeoHead'

export default function GamePage (props) {
  const { game, teams, leagues, isGamePreview, games } = props
  let title, seoDescriptionSuffix
  if (game.homeTeam && game.awayTeam) {
    title = `${game.league.title} Matchup: ${game.homeTeam.name} vs ${game.awayTeam.name}`
    seoDescriptionSuffix = teams[0].name + ' vs ' + teams[1].name + ' - ' + showDate(game.scheduledTime)
  } else {
    title = `${game.league.title} ${game.name}`
    seoDescriptionSuffix = `${game.league.title} ${game.name}`
  }
  const shareImage = teams.find(team => team.image && team.image.publicUrl)?.image?.publicUrl
  return (
    <>
      <SeoHead
        title={title}
        description={(isGamePreview ? 'Game Preview' : 'Game Recap') + ': ' + seoDescriptionSuffix}
        path={buildGameUrl(game.league, game)}
        image={shareImage}
      />
      <HeaderNavigation leagues={leagues} />
      <div className="container">
        {isGamePreview
          ? (
            <p className="h1 text-center">Preview</p>
            )
          : (
            <p className="h1 text-center">Recap</p>
            )}
        <p className="lead text-center">
          <strong>{game.league.title}</strong>
          {
            game.name && <><br/><strong>{game.name}</strong></>
          }
          <br/> {showDate(game.scheduledTime)} - {showHourMinute(game.scheduledTime)}
          <br/> {game.location ? game.location.name : ''}
        </p>
        <div className="row">
          <p className="h3 text-center">Season Standings</p>
          <Standings
            games={games}
            league={game.league}
            teamsFilter={(team) => {
              return team.id === game.homeTeam.id || team.id === game.awayTeam.id
            }}
          />

          {
            teams.map(function (team, index) {
              const positionMap = {}
              team.players.forEach(player => {
                player?.preferredPositions?.split(', ').forEach(position => {
                  if (position) {
                    positionMap[position] = positionMap[position] || 0
                    positionMap[position]++
                  }
                })
              })
              return (
                <div className="col-sm-6" key={index}>
                  <div className="text-center">
                    {!isGamePreview && <p className="h1">{team.score}</p>}
                    {
                      team.image && team.image.publicUrl && (
                        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                          <a href={buildTeamUrl(game.league, team)}>
                            <img src={team.image.publicUrl} className="img-fluid rounded" alt={team.name} style={{ maxWidth: '100%', objectFit: 'contain' }}/>
                          </a>
                        </div>
                      )
                    }
                    {
                      (!team.image || !team.image.publicUrl) && (
                        <h2><a href={buildTeamUrl(game.league, team)}>{team.name}</a></h2>
                      )
                    }
                    {
                      team.image && team.image.publicUrl && (
                        <h2 className="mt-3"><a href={buildTeamUrl(game.league, team)}>{team.name}</a></h2>
                      )
                    }

                    {
                      Object.keys(positionMap).length > 0 && (
                        <p className="lead d-flex justify-content-around">
                          <span>Player Positions:</span>
                          {
                            Object.keys(positionMap).sort().map(position => <span key={position}><strong style={{ fontWeight: 'bold' }}>{position.charAt(0).toUpperCase() + position.slice(1)}</strong>: {positionMap[position]}</span>)
                          }
                        </p>
                      )
                    }
                  </div>
                  {isGamePreview
                    ? (
                      <>
                        <p><em>Note: Below are season-wide stats.</em></p>
                        <GameStatTable team={team} isGamePreview={isGamePreview} />
                      </>
                      )
                    : (
                      <>
                        {
                          team.stats.length > 0 && (
                            <>
                              <h3>Attended</h3>
                              <GameStatTable team={team} isGamePreview={isGamePreview} />
                            </>
                          )
                        }
                        <h3>{team.stats.length > 0 ? 'Missing' : 'Stats Pending'}</h3>
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {team.stats?.filter(stat => !stat.attended).map((stat, index) => (
                              <tr key={index}>
                                <td><PlayerLink player={stat.player} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                      )
                  }
                </div>
              )
            })
          }
        </div>
      </div>
    </>
  )
}
