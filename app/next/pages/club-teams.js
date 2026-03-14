import Head from 'next/head'
import { gql } from '@apollo/client'
import GraphqlClient from '../lib/graphql-client'
import { HeaderNavigation } from '../components/Navigation'
import { updateWithGlobalServerSideProps } from '../lib/global-server-side-props'

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
    team.links.sort(function (a, b) {
      const priority = ['Instagram', 'Facebook', 'Twitter', 'Interest Form', 'Website']
      return priority.indexOf(a.label) - priority.indexOf(b.label)
    })
    return team
  })

  const props = { clubTeams }
  await updateWithGlobalServerSideProps(props)
  return { props }
}

export default function ClubTeamsPage (props) {
  const { clubTeams, leagues } = props
  return (
    <>
      <Head>
        <title>South Florida Club Teams</title>
        <meta property="og:title" content="South Florida Club Teams" />
        <meta property="og:url" content="https://www.sflultimate.com/club-teams" />
        <meta property="og:description" content="See what club teams are local to the South Florida area in the mens, mixed, womens, and college divisions!" />
        <style>{`
          .img-fluid {
            width: 150px;
            min-width: 150px;
            object-fit: contain;
          }
          
          @media (max-width: 767.98px) {
            .img-fluid {
              width: 75px;
              min-width: 75px;
            }
          }
              
          `
        }
        </style>
      </Head>
      <HeaderNavigation leagues={leagues} />
      <div className="container">
        <h1>Club Teams</h1>
        <p className="lead">South Florida has several local club teams that compete at a state and national level.</p>
        <div>
          {
            clubTeams.map((team, index) => (
              team.active && (
                <div className="d-flex card p-3 mb-3 flex-column flex-md-row shadow-sm" key={index}>
                  <div className="d-flex justify-content-start align-items-center">
                    {
                      team.image && (
                        <>
                          <img
                            src={team.image.publicUrl}
                            alt={team.name}
                            className="img-fluid rounded-circle"
                          />
                        <h2 className="d-md-none ms-2">{team.name}</h2>
                        </>
                      )
                    }
                  </div>
                  <div className="ms-2 me-2 mt-2 ms-md-4 mt-md-0 flex-grow-1">
                    <h2 className="d-none d-lg-block">{team.name}</h2>
                    <p>
                      <strong>{team.category}</strong>
                    </p>
                    <p>{team.description}</p>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="btn-group">
                      {
                        team?.links?.map((link, i) => {
                          const iconTypes = [
                            {
                              label: 'instagram',
                              icon: 'fa-instagram'
                            },
                            {
                              label: 'facebook',
                              icon: 'fa-facebook'
                            },
                            {
                              label: 'twitter',
                              icon: 'fa-twitter'
                            }
                          ]
                          const matchingIcon = iconTypes.find((iconType) => link.label.toLowerCase().includes(iconType.label))
                          return (
                              <>
                                <a key={i} className="btn btn-outline-primary text-nowrap" href={link.url} target="_blank" rel="noopener noreferrer">
                                  {matchingIcon ? <i className={[matchingIcon.icon, 'fa'].join(' ')}></i> : link.label}
                                </a>
                              </>
                          )
                        }
                        )
                      }
                    </div>
                  </div>
                </div>
              )
            ))
          }
        </div>
      </div>
    </>
  )
}
