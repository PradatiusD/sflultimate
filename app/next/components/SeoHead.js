import Head from 'next/head'
import { buildSeoMeta } from '../lib/seo'

export default function SeoHead (props) {
  const meta = buildSeoMeta(props)

  return (
    <Head>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      {
        meta.keywords && (
          <meta name="keywords" content={meta.keywords} />
        )
      }
      <link rel="canonical" href={meta.canonicalUrl} />
      <meta name="robots" content={meta.robots} />

      <meta property="og:site_name" content={meta.siteName} />
      <meta property="og:locale" content={meta.locale} />
      <meta property="og:type" content={meta.ogType} />
      <meta property="og:title" content={meta.ogTitle} />
      <meta property="og:description" content={meta.ogDescription} />
      <meta property="og:url" content={meta.ogUrl} />
      {
        meta.ogImage && (
          <>
            <meta property="og:image" content={meta.ogImage} />
            {
              meta.ogImageWidth && (
                <meta property="og:image:width" content={meta.ogImageWidth} />
              )
            }
            {
              meta.ogImageHeight && (
                <meta property="og:image:height" content={meta.ogImageHeight} />
              )
            }
          </>
        )
      }
      {
        meta.ogImageAlt && (
          <meta property="og:image:alt" content={meta.ogImageAlt} />
        )
      }

      <meta name="twitter:card" content={meta.twitterCard} />
      <meta name="twitter:title" content={meta.twitterTitle} />
      <meta name="twitter:description" content={meta.twitterDescription} />
      {
        meta.twitterImage && (
          <meta name="twitter:image" content={meta.twitterImage} />
        )
      }

      {
        meta.publishedTime && (
          <meta property="article:published_time" content={meta.publishedTime} />
        )
      }
      {
        meta.modifiedTime && (
          <meta property="article:modified_time" content={meta.modifiedTime} />
        )
      }

      {props.children}
    </Head>
  )
}
