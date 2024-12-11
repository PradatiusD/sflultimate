import Head from 'next/head'
import { gql } from '@apollo/client'
import GraphqlClient from '../lib/graphql-client'
export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allClubTeams {
          id
          name
          category
          description
          active
          image {
            publicUrl
          }
          instagramPageUrl
          interestFormPageUrl
          facebookPageUrl
          twitterPageUrl
          websiteUrl
        }
      }`
  })
  const clubTeams = JSON.parse(JSON.stringify(results.data.allClubTeams)).map(function (team) {
    team.links = []
    for (const key in team) {
      const url = team[key]
      if (key.includes('Url') && url) {
        const label = key
          .replace('Url', '')
          .replace('Page', '')
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, function (str) {
            return str.toUpperCase()
          })

        const link = {
          label,
          url
        }

        team.links.push(link)
      }
    }
    return team
  })
  
  return { props: { clubTeams } }
}

export default function ClubTeamsPage (props) {
  const {clubTeams} = props
  return (
    <>
      <Head>
        <meta property="og:title" content="South Florida Club Teams" />
        <meta property="og:url" content="https://www.sflultimate.com/club-teams" />
        <meta property="og:description" content="See what teams are local to the South Florida area!" />
      </Head>
      <div className="container">
        <h1>Club Teams</h1>
        <p className="lead">South Florida has several local club teams that compete at a state and national level.</p>
        <div>
          {clubTeams.map((team, index) => (
            team.active && (
              <div className="row" key={index}>
                <div className="col-sm-3 text-center">
                  {team.image && (
                    <img
                      src={team.image.publicUrl}
                      alt={team.name}
                      className="img-responsive"
                      style={{ margin: '0 auto' }}
                    />
                  )}
                </div>
                <div className="col-sm-9">
                  <h2>{team.name}</h2>
                  <p>
                    <strong>{team.category}</strong>
                  </p>
                  <p>{team.description}</p>
                  <ul className="list-inline">
                    {team?.links?.map((link, i) => (
                      <li key={i}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <hr/>
              </div>
            )
          ))}
        </div>
      </div>
    </>
  )
}
