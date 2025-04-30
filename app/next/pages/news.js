import GraphqlClient from '../lib/graphql-client'
import { gql } from '@apollo/client'
import { HeaderNavigation } from '../components/Navigation'
import Head from 'next/head'
import { showDate } from '../lib/utils'
import LeagueUtils from '../lib/league-utils'

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allLeagues(where:{isActive: true}) {
          id
          title
          earlyRegistrationStart
          earlyRegistrationEnd
          registrationStart
          registrationEnd
          lateRegistrationStart
          lateRegistrationEnd
        }
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
  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  LeagueUtils.addLeagueStatus(league)
  return { props: { posts, league } }
}

export default function PostsPage (props) {
  const { posts, league } = props
  return (
    <>
      <Head>
        <title>South Florida Ultimate News</title>
        <meta property="og:title" content="South Florida Ultimate News" />
        <meta property="og:url" content="https://www.sflultimate.com/news" />
        <meta property="og:description" content="Find out local news from your South Florida Ultimate Area" />
      </Head>
      <HeaderNavigation league={league} />
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
                      <img src={post.image.publicUrl} alt={post.title} className="img-responsive img-rounded" />
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
