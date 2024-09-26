import Head from 'next/head'
import GraphqlClient from "../lib/graphql-client";
import {gql} from "@apollo/client";

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
          query {
            allBoardMembers {
              id
              firstName
              lastName
              image {
                publicUrl
              }
              description
              active
            }
            allBoardPositions {
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
  
  return { props: { boardMembers: results.data.allBoardMembers, positions: results.data.allBoardPositions } }
}

export default function BoardPage (props) {
  const {positions, boardMembers} = props
  return (
    <>
      <Head>
        <meta property = "og:title"        content="South Florida Board" />
        <meta property="og:url"          content="https://www.sflultimate.com/board" />
        <meta property="og:description"  content="Learn how to become involved in your South Florida Ultimate board!" />
      </Head>
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