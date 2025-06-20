import GraphqlClient from '../../lib/graphql-client'
import { gql } from '@apollo/client'
import { HeaderNavigation } from '../../components/Navigation'
import Head from 'next/head'
import { showDate } from '../../lib/utils'
import LeagueUtils from '../../lib/league-utils'

export const getServerSideProps = async (context) => {
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
  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  LeagueUtils.addLeagueStatus(league)
  return { props: { post, league } }
}

export default function PostsPage (props) {
  const { post, league } = props
  return (
    <>
      <Head>
        <title>South Florida Ultimate News</title>
        <meta property="og:title" content="South Florida Ultimate News" />
        <meta property="og:url" content={'https://www.sflultimate.com/news/' + post.slug} />
        <meta property="og:image" content={post.image.publicUrl} />
        <meta property="og:description" content={post.summary} />
      </Head>
      <HeaderNavigation league={league} />
      <div className="container">
        <img src={post.image.publicUrl} alt={post.title} className="img-responsive img-rounded" style={{ margin: '1rem auto', maxHeight: '500px' }} />
        <h2>{post.title}</h2>
        <p className="text-muted">Published: {showDate(post.publishedDate, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        <div dangerouslySetInnerHTML={{ __html: post.body }}/>
      </div>
    </>
  )
}
