import GraphqlClient from '../../lib/graphql-client'
import { gql } from '@apollo/client'
import { HeaderNavigation } from '../../components/Navigation'
import Head from 'next/head'
import { useEffect } from 'react'
import { showDate } from '../../lib/utils'
import { parse } from 'node-html-parser'
import { updateWithGlobalServerSideProps } from '../../lib/global-server-side-props'

export const getServerSideProps = async (context) => {
  const { expandArticleShortcodes } = require('../../lib/article-shortcodes')
  const results = await GraphqlClient.query({
    query: gql`
        query {
          allPosts(where: {slug: "${context.params.slug}"}) {
            id
            title
            slug
            summary
            body
            publishedDate
            image {
              publicUrl
            }
          }
        }`
  })

  const post = JSON.parse(JSON.stringify(results.data.allPosts[0]))
  const { html: expandedBody, footerScripts } = expandArticleShortcodes(post.body)
  post.body = expandedBody
  post.footerScripts = footerScripts
  const props = { post }
  await updateWithGlobalServerSideProps(props)
  return { props }
}

export default function PostsPage (props) {
  const { post, leagues } = props
  const parsedBody = parse(post.body)
  parsedBody.getElementsByTagName('table').forEach(table => {
    const $thead = parse('<thead></thead>').firstElementChild
    table.prepend($thead)
    const firstTr = table.querySelector('tbody').firstElementChild
    $thead.append(firstTr)
    $thead.innerHTML = $thead.innerHTML.replace(/<td/g, '<th')
    table.classList.add('table')
    table.classList.add('table-striped')
    table.classList.add('table-bordered')
    table.removeAttribute('style')
  })
  const modifiedBody = parsedBody.outerHTML

  useEffect(() => {
    const appendedScripts = []
    const scriptsToAppend = [...(post.footerScripts || [])]

    if (modifiedBody.includes('instagram-media')) {
      scriptsToAppend.push({ src: 'https://www.instagram.com/embed.js' })
    }

    scriptsToAppend.forEach(script => {
      const scriptEl = document.createElement('script')

      if (script.src) {
        scriptEl.src = script.src
      } else if (script.content) {
        scriptEl.text = script.content
      }

      document.body.appendChild(scriptEl)
      appendedScripts.push(scriptEl)
    })

    return function cleanupScripts () {
      appendedScripts.forEach(scriptEl => {
        scriptEl.remove()
      })
    }
  }, [modifiedBody, post.footerScripts])

  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta property="og:title" content={post.title} />
        <meta property="og:url" content={'https://www.sflultimate.com/news/' + post.slug} />
        <meta property="og:image" content={post.image.publicUrl} />
        <meta property="og:description" content={post.summary.replace(/<[^>]*>/g, '')} />
      </Head>
      <HeaderNavigation leagues={leagues} />
      <div className="container">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            {
              post.image && (
                <img src={post.image.publicUrl} alt={post.title} className="img-fluid rounded" style={{ margin: '1rem auto', maxHeight: '500px' }} />
              )
            }
            <h1>{post.title}</h1>
            <p className="text-muted">Published: {showDate(post.publishedDate, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <div dangerouslySetInnerHTML={{ __html: modifiedBody }}/>
          </div>
        </div>
      </div>
    </>
  )
}
