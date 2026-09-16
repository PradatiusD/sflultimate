import GraphqlClient from '../../lib/server-graphql-client'
import { gql } from '@apollo/client'
import { HeaderNavigation } from '../../components/Navigation'
import ShortcodeContent from '../../components/ShortcodeContent'
import { showDate } from '../../lib/utils'
import { parse } from 'node-html-parser'
import { updateWithGlobalServerSideProps } from '../../lib/global-server-side-props'
import SeoHead from '../../components/SeoHead'

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
  const seoDescription = post.summary ? post.summary.replace(/<[^>]*>/g, '') : post.title

  return (
    <>
      <SeoHead
        title={post.title}
        description={seoDescription}
        path={`/news/${post.slug}`}
        image={post.image?.publicUrl}
        ogType="article"
        publishedTime={post.publishedDate}
      />
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
            <ShortcodeContent html={modifiedBody} footerScripts={post.footerScripts} />
          </div>
        </div>
      </div>
    </>
  )
}
