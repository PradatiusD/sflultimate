import GraphqlClient from '../lib/graphql-client'
import { gql } from '@apollo/client'
import { HeaderNavigation } from '../components/Navigation'
import { showDate } from '../lib/utils'
import { updateWithGlobalServerSideProps } from '../lib/global-server-side-props'
import SeoHead from '../components/SeoHead'

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
  const props = { posts }
  await updateWithGlobalServerSideProps(props)
  return { props }
}

export default function PostsPage (props) {
  const { posts, leagues } = props
  return (
    <>
      <SeoHead
        title="South Florida Ultimate News"
        description="Catch up on South Florida Ultimate league updates, community stories, announcements, and local Ultimate news."
        path="/news"
      />
      <HeaderNavigation leagues={leagues} />
      <div className="container">
        <h1>Posts</h1>
        {
          posts.map((post) => {
            const postUrl = '/news/' + post.slug
            return (
              <div key={post.id}>
                <div className="row">
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
                </div>
                <hr />
              </div>
            )
          })
        }
      </div>
    </>
  )
}
