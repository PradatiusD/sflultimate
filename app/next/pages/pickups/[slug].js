import Head from 'next/head'
import { gql } from '@apollo/client'
import GraphqlClient from '../../lib/graphql-client'
import { HeaderNavigation } from '../../components/Navigation'
import LeagueUtils from '../../lib/league-utils'
export const getServerSideProps = async (context) => {
  const results = await GraphqlClient.query({
    query: gql`
          query {
            allLeagues(where:{isActive: true}) {
              title
              earlyRegistrationStart
              earlyRegistrationEnd
              registrationStart
              registrationEnd
              lateRegistrationStart
              lateRegistrationEnd
            }
            allPickups(where: {isActive: true, slug: "${context.params.slug}"}, sortBy: order_ASC) {
              id
              updatedAt
              slug
              title
              order
              day
              time
              description
              locationName
              locationType
              locationAddressStreet
              locationAddressCity
              locationAddressState
              locationAddressZipCode
              locationLatitude
              locationLongitude
              contactWhatsapp
              contactUrl
              contactEmail
              contactPhone
            }
        }`
  })
  const league = JSON.parse(JSON.stringify(results.data.allLeagues[0]))
  LeagueUtils.addLeagueStatus(league)
  const pickup = results.data.allPickups[0]
  return { props: { pickup, league } }
}
export default function PickupsPage (props) {
  const { pickup, league } = props
  return (
    <>
      <Head>
        <title>SFLUltimate: {pickup.title}</title>
        <meta property="og:title" content={pickup.description}/>
        <meta property="og:url" content={'https://www.sflultimate.com/pickups/' + pickup.slug}/>
        <meta property="og:description" content={pickup.description}/>
        <meta property="og:image" content="https://www.sflultimate.com/images/dave-catching-face.jpg"/>
      </Head>
      <HeaderNavigation league={league} />

      <div className="container pickup-listing-page">
        <div className="alert alert-info" role="alert">
          <strong>How is this pickup information generated/updated?</strong><br/> We try our best to keep an accurate,
          up-to-date list, but as pickups grow and fade out we do sometimes not reflect the most up to date data. Have a
          suggestion or correction? Email <a href="mailto:sflultimate@gmail.com">sflultimate@gmail.com</a> with your
          suggestion and we'll take care of updating it.
        </div>

        <div className="alert alert-warning" role="alert">
          <strong>Reach Out Before You Play</strong><br/>Please reach out to the pickup before heading there to play.
          Due to weather, turnout, or competing local events/tournaments, sometimes pickups do not happen, so it's best
          to get confirmation from the pickup organizer before heading there to play.
        </div>

        <article className="col-md-6">
          <h1>{pickup.title}</h1>
          <span className="badge">{pickup.locationType}</span>
          <p className="lead">{pickup.day} at {pickup.time}</p>
          <p>{pickup.description}</p>

          <address>
            <strong>{pickup.locationName}</strong><br/>
            {pickup.locationAddressStreet}<br/>
            {pickup.locationAddressCity}, {pickup.locationAddressState}, {pickup.locationAddressZipCode}<br/>
          </address>
          <div className="btn-group">
            {pickup.contactWhatsapp && <a className="btn btn-sm btn-default" href={pickup.contactWhatsapp} target="_blank">Join WhatsApp Group</a>}
            {pickup.contactUrl && <a className="btn btn-sm btn-default" href={pickup.contactUrl} target="_blank">View Website</a>}
            {pickup.contactEmail && <a className="btn btn-sm btn-default" href={`mailto:${pickup.contactEmail}`} target="_blank">Send Email</a>}
            {pickup.contactPhone && <a className="btn btn-sm btn-default" href={`tel:${pickup.contactPhone}`}>Call Phone</a>}
            <a className="btn btn-sm btn-default" href={`https://www.google.com/maps/place/${pickup.locationAddressStreet + ' ' + pickup.locationAddressCity + ' ' + pickup.locationAddressState + ' ' + pickup.locationAddressZipCode}`} target="_blank">View on Map</a>
          </div>
        </article>
        <div class="col-md-6">
          <section id="pickup-listing-map" style={{ height: '400px' }} dangerouslySetInnerHTML={{
            __html: ''
          }}></section>
        </div>
      </div>
      <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDld-_TKoN-4PGLgQ1-JwN607eT4RfAMSQ" />
      <script dangerouslySetInnerHTML={{
        __html: `
        var map = new google.maps.Map(document.getElementById('pickup-listing-map'), {
          zoom: 8,
          center: {
            lat: 26.076477,
            lng: -80.252113
          }
        })
        
        var infoWindows = []
        
        const pickups = ${JSON.stringify([pickup])}
      
        pickups.forEach(function (game) {
          const contentString = '' +
            '<div id="content">' +
            '<div id="siteNotice"></div>' +
            '<h4 id="firstHeading" class="firstHeading">' + game.title + '</h4>' +
            '<p class="text-muted"><b>' + game.day + ' at ' + game.time + '</b></p>' +
            '<p><b>' + game.locationType.toUpperCase() + ': </b>' + game.description + '</p>' +
            '<div id="bodyContent">' +
            '' + game.locationAddressStreet + '<br>' + game.locationAddressCity + ', ' + game.locationAddressState + ', ' + game.locationAddressZipCode + '<br>' +
            '</div>'
        
          const infoWindow = new google.maps.InfoWindow({
            content: contentString
          })
        
          infoWindows.push(infoWindow)
        
          const markerOptions = {
            map: map,
            position: {
              lat: game.locationLatitude,
              lng: game.locationLongitude
            },
            title: game.title
          }
          
          const marker = new google.maps.Marker(markerOptions)
        
          marker.addListener('click', function () {
            infoWindows.forEach(function (infoWindowItem) {
              infoWindowItem.close()
            })
            infoWindow.open(map, marker)
          })
        })
      `
      }}>
      </script>
    </>
  )
}
