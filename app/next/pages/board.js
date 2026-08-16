import { useState } from 'react'
import GraphqlClient from '../lib/graphql-client'
import { gql } from '@apollo/client'
import { HeaderNavigation } from '../components/Navigation'
import Modal from '../components/Modal'
import { updateWithGlobalServerSideProps } from '../lib/global-server-side-props'
import SeoHead from '../components/SeoHead'

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

function getBoardMemberName (member) {
  if (!member) {
    return ''
  }

  return [member.firstName, member.lastName].filter(Boolean).join(' ')
}

function hasExtendedBoardBio (description, maxLength = BOARD_BIO_PREVIEW_LENGTH) {
  if (!description) {
    return false
  }

  return description.replace(/\s+/g, ' ').trim().length > maxLength
}

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allBoardPositions(sortBy: order_ASC) {
          id
          title
          description
          commitment
          active
          assigned {
            id
            firstName
            lastName
            order
            description
            active
            image {
              publicUrl
            }
          }
        }
      }`
  })

  const props = {
    positions: JSON.parse(JSON.stringify(results.data.allBoardPositions))
  }
  await updateWithGlobalServerSideProps(props)
  return {
    props
  }
}

export default function BoardPage (props) {
  const { positions, leagues } = props
  const [activeMember, setActiveMember] = useState(null)

  const links = [
    {
      url: 'https://forms.gle/L9yK9o8p9gG2Cue66',
      label: 'Apply'
    }
  ]

  const boardPositions = positions
    .filter(position => position.active)
    .map(position => ({
      ...position,
      links,
      assignedMembers: (position.assigned || [])
        .filter(member => member && member.active !== false)
        .sort((a, b) => a.order - b.order)
    }))

  function openMemberModal (member, positionTitle) {
    setActiveMember({
      ...member,
      positionTitle
    })
  }

  function closeMemberModal () {
    setActiveMember(null)
  }

  return (
    <>
      <SeoHead
        title="South Florida Ultimate Board"
        ogTitle="SFLUltimate | Join Our Board"
        description="We’re looking for passionate, community-driven players to step up and shape the future of the game by volunteering or serving on the South Florida Ultimate board."
        path="/board"
        image="https://d137pw2ndt5u9c.cloudfront.net/keystone/682dac872efed40028e728e6-temp-5.jpg"
        imageWidth={1200}
        imageHeight={630}
      />
      <HeaderNavigation leagues={leagues} />
      <img src="https://d137pw2ndt5u9c.cloudfront.net/keystone/682db0ce069a32002858c125-frisbee_final-417-o.jpg" alt="League Finals 2025" className="img-fluid"/>
      <div className="container">
        <h1>Board</h1>
        <h2>Our Positions</h2>
        <div>
          <p className="lead">
            It takes a community to grow one. Here&#39;s the roles needed to make this happen.
          </p>
          <div className="row board-members-grid">
            {boardPositions.map((position) => {
              const assignedMembers = position.assignedMembers
              const primaryMember = assignedMembers[0] || null
              const hasAssignedMember = Boolean(primaryMember)
              const assignedMemberNames = assignedMembers.map(getBoardMemberName).join(' & ')
              const hasMemberBio = Boolean(primaryMember?.description)
              const assignedMemberSummary = hasAssignedMember
                ? getBoardBioPreview(primaryMember.description) || `${assignedMemberNames} ${assignedMembers.length > 1 ? 'currently share this role.' : 'currently serves in this role.'}`
                : 'This role is currently open. Review the position details and apply if you would like to help support the community.'
              const canOpenMemberModal = assignedMembers.length === 1 && hasMemberBio

              return (
                <div className="col-sm-6 col-lg-4 mb-4 d-flex" key={position.id}>
                  <div className="card board-member-card board-position-card w-100">
                    <div className="board-member-card__image-wrapper">
                      {primaryMember?.image
                        ? (
                        <img
                          src={primaryMember.image.publicUrl}
                          alt={`${position.title} - ${assignedMemberNames}`}
                          className="card-img-top board-member-card__image"
                        />
                          )
                        : (
                        <div className={`board-member-card__image-placeholder ${hasAssignedMember ? 'board-member-card__image-placeholder--member' : 'board-member-card__image-placeholder--vacant'}`}>
                          <i className="fa fa-user board-member-card__image-placeholder-icon" aria-hidden="true"></i>
                          <span>{hasAssignedMember ? assignedMemberNames : 'Open Position'}</span>
                        </div>
                          )}
                    </div>
                    <div className="card-body board-member-card__body">
                      <div className="board-position-card__badges">
                        {position.commitment && (
                          <span className="badge bg-secondary board-position-card__badge">
                            {position.commitment}
                          </span>
                        )}
                        <span className={`badge board-position-card__badge ${hasAssignedMember ? 'bg-success' : 'bg-light text-dark border'}`}>
                          {hasAssignedMember ? 'Filled' : 'Open'}
                        </span>
                      </div>
                      {hasAssignedMember
                        ? (
                        <>
                          <h3 className="board-member-card__name">
                            {assignedMemberNames}
                          </h3>
                          <p className="board-position-card__role">
                            {position.title}
                          </p>
                          <p className="board-member-card__bio-preview mb-2">
                            {assignedMemberSummary}
                          </p>
                          {canOpenMemberModal && (
                            <button
                              type="button"
                              className="btn btn-link board-member-card__bio-link"
                              onClick={() => openMemberModal(primaryMember, position.title)}
                            >
                              {hasExtendedBoardBio(primaryMember.description) ? 'Read full bio' : 'View bio'}
                            </button>
                          )}
                        </>
                          )
                        : (
                        <>
                          <h3 className="board-member-card__name">
                            {position.title}
                          </h3>
                          <p className="board-position-card__status">
                            <strong>Available for application</strong>
                          </p>
                          <div
                            className="board-position-card__description"
                            dangerouslySetInnerHTML={{ __html: position.description }}
                          ></div>
                        </>
                          )}
                      {!hasAssignedMember && (
                        <ul className="list-inline mb-0">
                          {position?.links?.map((link, i) => (
                            <li key={i} className="list-inline-item mb-0">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary board-position-card__apply-btn"
                              >
                                <i className="fa fa-paper-plane" aria-hidden="true"></i>{' '}
                                {link.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <Modal
        id="board-member-modal"
        isOpen={Boolean(activeMember)}
        onClose={closeMemberModal}
        title={activeMember ? `${activeMember.firstName} ${activeMember.lastName}${activeMember.positionTitle ? ` - ${activeMember.positionTitle}` : ''}` : ''}
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
