import Head from 'next/head'
import { useState } from 'react'
import GraphqlClient from '../lib/graphql-client'
import { gql } from '@apollo/client'
import { HeaderNavigation } from '../components/Navigation'
import Modal from '../components/Modal'
import { updateWithGlobalServerSideProps } from '../lib/global-server-side-props'

const BOARD_BIO_PREVIEW_LENGTH = 140

function getBoardBioPreview (description, maxLength = BOARD_BIO_PREVIEW_LENGTH) {
  if (!description) {
    return ''
  }

  const normalizedDescription = description.replace(/\s+/g, ' ').trim()

  if (normalizedDescription.length <= maxLength) {
    return normalizedDescription
  }

  const previewCandidate = normalizedDescription.slice(0, maxLength + 1)
  const lastWhitespaceIndex = previewCandidate.search(/\s\S*$/)
  const cutoffIndex = lastWhitespaceIndex > 0 ? lastWhitespaceIndex : maxLength

  return `${previewCandidate.slice(0, cutoffIndex).trimEnd()}...`
}

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
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
          commitment
          active
          assigned {
            firstName
            lastName
          }
        }
      }`
  })

  const props = {
    boardMembers: results.data.allBoardMembers,
    positions: JSON.parse(JSON.stringify(results.data.allBoardPositions))
  }
  await updateWithGlobalServerSideProps(props)
  return {
    props
  }
}

export default function BoardPage (props) {
  const { positions, boardMembers, leagues } = props
  const [activeMember, setActiveMember] = useState(null)

  const links = [
    {
      url: 'https://forms.gle/L9yK9o8p9gG2Cue66',
      label: 'Apply'
    }
  ]

  positions.forEach((item) => {
    item.links = links
  })

  function openMemberModal (member) {
    setActiveMember(member)
  }

  function closeMemberModal () {
    setActiveMember(null)
  }

  return (
    <>
      <Head>
        <title>South Florida Ultimate Board</title>
        <meta property="og:title" content="SFLUltimate | Join Our Board" />
        <meta property="og:description" content="We’re looking for passionate, community-driven players to step up and shape the future of the game by volunteering or serving on the South Florida Ultimate board." />
        <meta property="og:url" content="https://www.sflultimate.com/board" />
        <meta property="og:image" content="https://d137pw2ndt5u9c.cloudfront.net/keystone/682dac872efed40028e728e6-temp-5.jpg"/>
        <meta property="og:image:width" content="1200"/>
        <meta property="og:image:height" content="630"/>
      </Head>
      <HeaderNavigation leagues={leagues} />
      <img src="https://d137pw2ndt5u9c.cloudfront.net/keystone/682db0ce069a32002858c125-frisbee_final-417-o.jpg" alt="League Finals 2025" className="img-fluid"/>
      <div className="container">
        <h1>Board</h1>
        <h2>Our Positions</h2>
        <div>
          <p className="lead">
            It takes a community to grow one. Here&#39;s the roles needed to make this happen.
          </p>
          {positions.map((position, index) => (
            position.active && (
              <div className="row" key={index}>
                <div className="col-sm-12">
                  <h2>
                    {position.title}
                  </h2>
                  <p>{position.commitment} Position • {' '}
                    {
                      position.assigned.length > 0
                        ? (
                      <strong>
                        Currently held by{' '}
                        {position.assigned
                          .map(p => `${p.firstName} ${p.lastName}`)
                          .join(' & ')}
                      </strong>
                          )
                        : (
                      <strong>Available for application</strong>
                          )
                    }
                  </p>
                  <p dangerouslySetInnerHTML={{ __html: position.description }}></p>
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
          <div className="row board-members-grid">
            {boardMembers.map((member) => (
              member.active && (
                <div className="col-sm-6 col-lg-4 mb-4 d-flex" key={member.id}>
                  <div className="card board-member-card w-100">
                    <div className="board-member-card__image-wrapper">
                      {member.image
                        ? (
                        <img
                          src={member.image.publicUrl}
                          alt={`${member.firstName} ${member.lastName}`}
                          className="card-img-top board-member-card__image"
                        />
                          )
                        : (
                        <div className="board-member-card__image-placeholder">
                          <span>{member.firstName} {member.lastName}</span>
                        </div>
                          )}
                    </div>
                    <div className="card-body board-member-card__body">
                      <h3 className="board-member-card__name">
                        {member.firstName} {member.lastName}
                      </h3>
                      <p className="board-member-card__bio-preview">
                        {getBoardBioPreview(member.description)}
                      </p>
                      <ul className="list-inline">
                        {member?.links?.map((link, i) => (
                          <li key={i}>
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                      {member.description && (
                        <button
                          type="button"
                          className="btn btn-outline-primary board-member-card__cta"
                          onClick={() => openMemberModal(member)}
                        >
                          Learn More
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
          <hr/>
        </div>
      </div>
      <Modal
        id="board-member-modal"
        isOpen={Boolean(activeMember)}
        onClose={closeMemberModal}
        title={activeMember ? `${activeMember.firstName} ${activeMember.lastName}` : ''}
        size="lg"
        footer={(
          <button type="button" className="btn btn-secondary" onClick={closeMemberModal}>
            Close
          </button>
        )}
      >
        {activeMember && (
          <div className="board-member-modal">
            {activeMember.image && (
              <img
                src={activeMember.image.publicUrl}
                alt={`${activeMember.firstName} ${activeMember.lastName}`}
                className="img-fluid rounded board-member-modal__image"
              />
            )}
            <p className="board-member-modal__bio mb-0">
              {activeMember.description}
            </p>
          </div>
        )}
      </Modal>
    </>
  )
}
