import Head from 'next/head'
import { useState } from 'react'
import { gql } from '@apollo/client'
import GraphqlClient from '../../lib/graphql-client'
import { HeaderNavigation } from '../../components/Navigation'
import Modal from '../../components/Modal'
import NotFound from 'next/error'
import { createSummary } from '../../lib/utils'
import { updateWithGlobalServerSideProps } from '../../lib/global-server-side-props'

function getGallerySummary (gallery, limit = 160) {
  if (!gallery.summary && !gallery.description) {
    return 'Browse this South Florida Ultimate gallery.'
  }

  return createSummary(gallery, limit)
}

export const getServerSideProps = async (context) => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allGalleries(where: { slug: "${context.params.slug}", isActive: true }) {
          id
          title
          slug
          summary
          description
          eventDateLabel
          coverImage {
            publicUrl
          }
          assets(sortBy: sortOrder_ASC) {
            id
            title
            assetType
            caption
            altText
            credit
            sortOrder
            file {
              publicUrl
              filename
            }
          }
        }
      }
    `
  })

  const gallery = results.data.allGalleries.length
    ? JSON.parse(JSON.stringify(results.data.allGalleries[0]))
    : null

  if (gallery && !gallery.assets) {
    gallery.assets = []
  }

  const props = { gallery }
  await updateWithGlobalServerSideProps(props)
  return { props }
}

function GalleryAsset ({ asset, galleryTitle, onOpenImage }) {
  const title = asset.title || asset.caption || asset.file.filename
  const altText = asset.altText || title || galleryTitle || 'Gallery image'

  return (
    <div className="gallery-masonry-item">
      <figure className="card">
        {
          asset.assetType === 'video'
            ? (
              <video
                className="card-img-top"
                controls
                preload="none"
                style={{ width: '100%', display: 'block' }}
              >
                <source src={asset.file.publicUrl} />
              </video>
              )
            : (
              <button
                type="button"
                onClick={() => onOpenImage({ src: asset.file.publicUrl, altText, title })}
                style={{ border: 0, padding: 0, background: 'transparent', width: '100%', display: 'block', cursor: 'zoom-in' }}
              >
                <img
                  src={asset.file.publicUrl}
                  alt={altText}
                  className="card-img-top img-fluid"
                  loading="lazy"
                  style={{ width: '100%', display: 'block' }}
                />
              </button>
              )
        }
        {
          (asset.caption || asset.credit) && (
            <figcaption className="card-body">
              {
                asset.caption && asset.caption !== title && (
                  <p style={{ marginBottom: '0.5rem' }}>{asset.caption}</p>
                )
              }
              {
                asset.credit && (
                  <small className="text-muted">Credit: {asset.credit}</small>
                )
              }
            </figcaption>
          )
        }
      </figure>
    </div>
  )
}

export default function GalleryItemPage (props) {
  const { gallery, leagues } = props
  const [activeImage, setActiveImage] = useState(null)

  if (!gallery) {
    return <NotFound statusCode={404} />
  }

  const seoDescription = getGallerySummary(gallery, 160)

  return (
    <>
      <Head>
        <title>{gallery.title || 'Gallery'} | South Florida Ultimate</title>
        <meta property="og:title" content={(gallery.title || 'Gallery') + ' | South Florida Ultimate'} />
        <meta property="og:url" content={'https://www.sflultimate.com/gallery/' + gallery.slug} />
        <meta property="og:description" content={seoDescription} />
        {
          gallery.coverImage && gallery.coverImage.publicUrl && (
            <meta property="og:image" content={gallery.coverImage.publicUrl} />
          )
        }
      </Head>
      <HeaderNavigation leagues={leagues} />
      <div className="container">
        <p><a href="/gallery">← Back to all galleries</a></p>
        <div className="row">
          <div className="col-lg-10 offset-lg-1">
            {
              gallery.coverImage && gallery.coverImage.publicUrl && (
                <img
                  src={gallery.coverImage.publicUrl}
                  alt={gallery.title || 'Gallery cover image'}
                  className="img-fluid rounded"
                  style={{ marginBottom: '1.5rem', width: '100%' }}
                />
              )
            }
            <h1>{gallery.title || 'Untitled Gallery'}</h1>
            {
              gallery.eventDateLabel && (
                <p className="text-muted">{gallery.eventDateLabel}</p>
              )
            }
            {
              gallery.summary && (
                <div className="lead" dangerouslySetInnerHTML={{ __html: gallery.summary }}/>
              )
            }
            {
              gallery.description && (
                <div style={{ marginBottom: '2rem' }} dangerouslySetInnerHTML={{ __html: gallery.description }}/>
              )
            }
          </div>
        </div>
        <div className="gallery-masonry mt-4">
            {
              gallery.assets.map(asset => (
                <GalleryAsset
                  asset={asset}
                  galleryTitle={gallery.title}
                  key={asset.id}
                  onOpenImage={setActiveImage}
                />
              ))
            }
        </div>
        {
          !gallery.assets.length && (
            <p>This gallery does not have any uploaded items yet.</p>
          )
        }
      </div>
      <Modal
        id={`gallery-image-modal-${gallery.id}`}
        isOpen={Boolean(activeImage)}
        onClose={() => setActiveImage(null)}
        title={activeImage ? (activeImage.title || gallery.title || 'Gallery image') : ''}
        size="lg"
      >
        {
          activeImage && (
            <img
              src={activeImage.src}
              alt={activeImage.altText}
              className="img-fluid rounded"
              style={{ width: '100%', display: 'block' }}
            />
          )
        }
      </Modal>
      <style jsx>{`
        .gallery-masonry {
          column-count: 1;
          column-gap: 1.5rem;
        }

        .gallery-masonry-item {
          display: inline-block;
          width: 100%;
          vertical-align: top;
          break-inside: avoid;
          page-break-inside: avoid;
          -webkit-column-break-inside: avoid;
          margin-bottom: 1.5rem;
        }

        .gallery-masonry-item :global(.card) {
          display: block;
          width: 100%;
          margin-bottom: 0;
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .gallery-masonry {
            column-count: 2;
          }
        }

        @media (min-width: 1200px) {
          .gallery-masonry {
            column-count: 3;
          }
        }
      `}</style>
    </>
  )
}
