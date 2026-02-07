import GraphqlClient from '../lib/graphql-client'
import { gql } from '@apollo/client'
import { HeaderNavigation } from '../components/Navigation'
import Head from 'next/head'
import { showDate } from '../lib/utils'
import {updateWithGlobalServerSideProps} from "../lib/global-server-side-props";

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allPosts(sortBy: publishedDate_DESC) {
          id
          title
          slug
          summary
          publishedDate
          image {
            publicUrl
          }
        }
      }`
  })

  const posts = JSON.parse(JSON.stringify(results.data.allPosts))
  const props = {posts}
  await updateWithGlobalServerSideProps(props)
  return { props }
}

export default function PostsPage (props) {
  const { posts, leagues } = props
  return (
    <>
      <Head>
        <title>South Florida Ultimate News</title>
        <meta property="og:title" content="South Florida Ultimate News" />
        <meta property="og:url" content="https://www.sflultimate.com/news" />
        <meta property="og:description" content="Find out local news from your South Florida Ultimate Area" />
      </Head>
      <HeaderNavigation leagues={leagues} />
      <div className="container">
        <h1>Posts</h1>
        {
          posts.map((post) => {
            const postUrl = '/news/' + post.slug
            return (
              <>
                <div key={post.id} className="row">
                  <div className="col-md-3">
                    <a href={postUrl}>
                      <img src={post.image.publicUrl} alt={post.title} className="img-fluid rounded" />
                    </a>
                  </div>
                  <div className="col-md-9">
                    <h2 style={{ marginTop: '0' }}><a href={postUrl}>{post.title}</a></h2>
                    <p className="text-muted">Published: {showDate(post.publishedDate, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <div dangerouslySetInnerHTML={{ __html: post.summary }}/>
                  </div>
                  <hr/>
                </div>
                <hr />
              </>
            )
          })
        }
      </div>
    </>
  )
}
