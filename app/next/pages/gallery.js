import Head from 'next/head'
import { gql } from '@apollo/client'
import GraphqlClient from '../lib/graphql-client'
import { HeaderNavigation } from '../components/Navigation'
import { createSummary } from '../lib/utils'
import { updateWithGlobalServerSideProps } from '../lib/global-server-side-props'

function getGallerySummary (gallery, limit = 180) {
  if (!gallery.summary && !gallery.description) {
    return 'Explore this gallery.'
  }

  return createSummary(gallery, limit)
}

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allGalleries(where: { isActive: true }, sortBy: sortOrder_ASC) {
          id
          title
          slug
          summary
          description
          eventDateLabel
          coverImage {
            publicUrl
          }
          assets {
            id
          }
        }
      }
    `
  })

  const galleries = JSON.parse(JSON.stringify(results.data.allGalleries || []))
  const props = { galleries }
  await updateWithGlobalServerSideProps(props)
  return { props }
}

function GalleryCard ({ gallery }) {
  const galleryUrl = '/gallery/' + gallery.slug
  const summary = getGallerySummary(gallery, 180)
  const assetCount = gallery.assets ? gallery.assets.length : 0

  return (
    <div className="col-md-6 col-lg-4" style={{ marginBottom: '2rem' }}>
      <div className="card h-100">
        {
          gallery.coverImage && gallery.coverImage.publicUrl && (
            <a href={galleryUrl}>
              <img
                src={gallery.coverImage.publicUrl}
                alt={gallery.title || 'Gallery cover image'}
                className="card-img-top img-fluid"
                loading="lazy"
                style={{ aspectRatio: '4 / 3', objectFit: 'cover' }}
              />
            </a>
          )
        }
        <div className="card-body">
          <h2 className="h4 card-title">
            <a href={galleryUrl}>{gallery.title || 'Untitled Gallery'}</a>
          </h2>
          {
            gallery.eventDateLabel && (
              <p className="text-muted" style={{ marginBottom: '0.5rem' }}>{gallery.eventDateLabel}</p>
            )
          }
          <p>{summary}</p>
        </div>
        <div className="card-footer bg-white">
          <a className="btn btn-primary" href={galleryUrl}>View Gallery</a>
          <span className="text-muted" style={{ marginLeft: '0.75rem' }}>{assetCount} item{assetCount === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  )
}

export default function GalleryPage (props) {
  const { galleries, leagues } = props

  return (
    <>
      <Head>
        <title>South Florida Ultimate Galleries</title>
        <meta property="og:title" content="South Florida Ultimate Galleries" />
        <meta property="og:url" content="https://www.sflultimate.com/gallery" />
        <meta property="og:description" content="Browse photo and video galleries from South Florida Ultimate events and community moments." />
      </Head>
      <HeaderNavigation leagues={leagues} />
      <div className="container">
        <h1>Galleries</h1>
        <p className="lead">Browse photo and video collections from South Florida Ultimate.</p>
        {
          !galleries.length && (
            <p>No galleries are available yet.</p>
          )
        }
        <div className="row">
          {galleries.map(gallery => <GalleryCard gallery={gallery} key={gallery.id} />)}
        </div>
      </div>
    </>
  )
}
