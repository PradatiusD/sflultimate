import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { gql } from '@apollo/client'
import GraphqlClient from '../../lib/server-graphql-client'
import { HeaderNavigation } from '../../components/Navigation'
import NotFound from 'next/error'
import { createSummary } from '../../lib/utils'
import { updateWithGlobalServerSideProps } from '../../lib/global-server-side-props'
import SeoHead from '../../components/SeoHead'

const GalleryLightbox = dynamic(() => import('../../components/GalleryLightbox'), { ssr: false })

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
                onClick={() => onOpenImage(asset.id)}
                aria-label={`View ${altText}`}
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
  const [activeIndex, setActiveIndex] = useState(-1)
  const imageAssets = useMemo(() => (gallery?.assets || []).filter(asset => asset.assetType !== 'video'), [gallery])
  const slides = useMemo(() => imageAssets.map(asset => ({
    src: asset.file.publicUrl,
    alt: asset.altText || asset.title || asset.caption || gallery.title || 'Gallery image',
    description: [asset.title, asset.caption !== asset.title && asset.caption, asset.credit && `Credit: ${asset.credit}`].filter(Boolean).join(' — ')
  })), [imageAssets, gallery])

  if (!gallery) {
    return <NotFound statusCode={404} />
  }

  const seoDescription = getGallerySummary(gallery, 160)

  return (
    <>
      <SeoHead
        title={`${gallery.title || 'Gallery'} | South Florida Ultimate`}
        description={seoDescription}
        path={`/gallery/${gallery.slug}`}
        image={gallery.coverImage?.publicUrl}
      />
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
                  onOpenImage={id => setActiveIndex(imageAssets.findIndex(image => image.id === id))}
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
      {activeIndex >= 0 && (
        <GalleryLightbox
          slides={slides}
          index={activeIndex}
          onClose={() => setActiveIndex(-1)}
        />
      )}
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
