import { PlayerLink } from './PlayerLink'
import { buildTeamUrl } from '../lib/team-utils'

function PlayerImage (props) {
  const { player } = props
  const srcUrl = player.profileImage && player.profileImage.publicUrl ? player.profileImage.publicUrl : 'https://placehold.co/200x200?text=Image+Pending'
  const imgClass = ['player-img']
  if (props.className) {
    imgClass.push(props.className)
  }
  return (
    <img src={srcUrl} alt={player.name + ' league profile photo'} className={imgClass.join(' ')}/>
  )
}

function PlayerImageWithName (props) {
  const { player } = props
  const playerImgProps = { ...props, className: 'card-img-top' }
  return (
    <div key={player.id}>
      <div className="card">
        <PlayerImage {...playerImgProps} />
        <div className="card-body text-center">
          <h5 className="card-title"><PlayerLink player={player}/></h5>
        </div>
      </div>
    </div>
  )
}

function PlayerGallery (props) {
  const { players } = props
  return (
    <div className="pending-team-grid">
      {
        players.map((player) => {
          return <PlayerImageWithName key={player} player={player} className="pending-team"/>
        })
      }
    </div>
  )
}

export default function LeagueTeams (props) {
  const { league, teams } = props

  if (teams.length === 0) {
    return (
      <>
        <div className="container">
          <h1>Teams Pending...</h1>
          <p className="lead">Players haven&#39;t been drafted yet, but here is who we have signed up so far!</p>
          <PlayerGallery {...props} />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="container">
        <h1>{league.title}</h1>
        <h2>Teams</h2>
        <hr/>
        <div className="team-list">
          <section>
            {
              teams.map((team, index) => {
                let menTotal = 0
                let womenTotal = 0
                team.players.forEach(function (player) {
                  if (player.gender === 'Male') {
                    menTotal++
                  }
                  if (player.gender === 'Female') {
                    womenTotal++
                  }
                })

                return (
                  <article key={team.id}>
                    <h3>
                      <span className="team-color" style={{ backgroundColor: team.color }}></span>
                      <a href={buildTeamUrl(league, team)}>{team.name}</a>
                    </h3>
                    <p className="lead">
                      {
                        team.captains.length > 0 && (
                          <>
                            <span>Captain{team.captains.length > 1 ? 's' : ''}: </span>
                            {
                              team.captains.map((captain, index) => {
                                return (
                                  <span
                                    key={index}>{captain.firstName} {captain.lastName}{index < team.captains.length - 1 ? ', ' : ''}</span>
                                )
                              })
                            }
                            <br/>
                          </>
                        )
                      }
                      <small className="text-muted">{womenTotal} women, {menTotal} men</small>
                    </p>
                    <table className="table table-striped table-bordered">
                      <tbody>
                      {
                        team.players.map((player, index) => {
                          const gender = player?.gender?.charAt(0)
                          return (
                            <tr key={player.id}>
                              <td>{index + 1}. <PlayerImage player={player} /> {gender} - <PlayerLink player={player} /></td>
                            </tr>
                          )
                        })
                      }
                      </tbody>
                    </table>
                  </article>
                )
              })
            }
          </section>
        </div>
      </div>
      <div className="container">
        <h2>Players</h2>
        <hr/>
        <PlayerGallery {...props} />
      </div>
    </>
  )
}
