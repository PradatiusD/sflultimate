import Head from 'next/head'
import GraphqlClient from "../lib/graphql-client";
import {gql} from "@apollo/client";
import {addLeagueStatus} from "../lib/payment-utils";
import {HeaderNavigation} from "../components/Navigation";

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allLeagues(where:{isActive: true}) {
          id
          title
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
        }
        allBoardMembers(sortBy: order_ASC) {
          id
          firstName
          lastName
          order
          image {
            publicUrl
          }
          description
          active
        }
        allBoardPositions(sortBy: order_ASC) {
          id
          title
          description
          active
          assigned {
            firstName
            lastName
          }
        }
      }`
  })

  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  addLeagueStatus(league)

  return {
    props: {
      boardMembers: results.data.allBoardMembers,
      positions: JSON.parse(JSON.stringify(results.data.allBoardPositions)),
      league
    }
  }
}

export default function BoardPage (props) {
  const {positions, boardMembers, league} = props

  const links = [
    {
      url: 'https://forms.gle/L9yK9o8p9gG2Cue66',
      label: 'Apply'
    }
  ]

  positions.forEach((item) => {
    item.links = links
  })
  
  return (
    <>
      <Head>
        <title>South Florida Board</title>
        <meta property="og:title" content="South Florida Board" />
        <meta property="og:url" content="https://www.sflultimate.com/board" />
        <meta property="og:description" content="Learn how to become involved in your South Florida Ultimate board!" />
      </Head>
      <HeaderNavigation league={league} />
      <div className="container">
        <h1>Board</h1>
        <h2>What We Need</h2>
        <div>
          <p className="lead">
            It takes a community to grow one. Here's the roles needed to make this happen.
          </p>
          {positions.map((position, index) => (
            position.active && (
              <div className="row" key={index}>
                <div className="col-sm-12">
                  <h2>{position.title}</h2>
                  {position.assigned.length > 0 ? (
                    <p>
                      <strong>
                        Currently held by{' '}
                        {position.assigned
                          .map(p => `${p.firstName} ${p.lastName}`)
                          .join(' & ')}
                      </strong>
                    </p>
                  ) : (
                    <p>
                      <strong>Available for application</strong>
                    </p>
                  )}
                  <p>{position.description}</p>
                  <ul className="list-inline">
                    {position?.links?.map((link, i) => (
                      <li key={i}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          ))}
          <hr/>
          <h2 className="text-center">Our Team</h2>
          {boardMembers.map((member, index) => (
            member.active && (
              <div className="row" style={{marginBottom: '1em'}} key={index}>
                <div className="col-md-4">
                  {member.image && (
                    <img
                      src={member.image.publicUrl}
                      alt={`${member.firstName} ${member.lastName}`}
                      className="img-responsive img-rounded"
                      style={{margin: '0 auto'}}
                    />
                  )}
                </div>
                <div className="col-md-8">
                  <h3 className="text-left">
                    {member.firstName} {member.lastName}
                  </h3>
                  <p>
                    <strong>{member.category}</strong>
                  </p>
                  <p>{member.description}</p>
                  <ul className="list-inline">
                    {member?.links?.map((link, i) => (
                      <li key={i}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          ))}
          <hr/>
        </div>
      </div>
    </>
  )
}
