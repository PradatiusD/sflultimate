import Head from 'next/head'
import { gql } from '@apollo/client'
import GraphqlClient from '../../lib/graphql-client'
import { HeaderNavigation } from '../../components/Navigation'
import { updateWithGlobalServerSideProps } from '../../lib/global-server-side-props'
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
              location {
                name
                type
                addressStreet
                addressCity
                addressState
                addressZipCode
                latitude
                longitude
              }
              contactWhatsapp
              contactUrl
              contactEmail
              contactPhone
            }
        }`
  })
  const pickup = results.data.allPickups[0]
  const props = { pickup }
  await updateWithGlobalServerSideProps(props)
  return { props }
}
export default function PickupsPage (props) {
  const { pickup, leagues } = props
  return (
    <>
      <Head>
        <title>SFLUltimate: {pickup.title}</title>
        <meta property="description" content={pickup.description} />
        <meta property="og:title" content={pickup.title}/>
        <meta property="og:url" content={'https://www.sflultimate.com/pickups/' + pickup.slug}/>
        <meta property="og:description" content={pickup.description}/>
        <meta property="og:image" content="https://www.sflultimate.com/images/dave-catching-face.jpg"/>
      </Head>
      <HeaderNavigation leagues={leagues} />

      <div className="container pickup-listing-page">
        <div className="alert alert-info" role="alert">
          <strong>How is this pickup information generated/updated?</strong><br/> We try our best to keep an accurate,
          up-to-date list, but as pickups grow and fade out we do sometimes not reflect the most up to date data. Have a
          suggestion or correction? Email <a href="mailto:sflultimate@gmail.com">sflultimate@gmail.com</a> with your
          suggestion and we&#39;ll take care of updating it.
        </div>

        <div className="alert alert-warning" role="alert">
          <strong>Reach Out Before You Play</strong><br/>Please reach out to the pickup before heading there to play.
          Due to weather, turnout, or competing local events/tournaments, sometimes pickups do not happen, so it's best
          to get confirmation from the pickup organizer before heading there to play.
        </div>
        <div className="row">
          <article className="col-md-6">
            <h1>{pickup.title}</h1>
            <p className="lead">{pickup.day} at {pickup.time}</p>
            <p>{pickup.description}</p>
            <address>
              <strong>{pickup.location.name}</strong><span className="badge bg-primary">{pickup.location.type}</span><br/>
              {pickup.location.addressStreet}<br/>
              {pickup.location.addressCity}, {pickup.location.addressState}, {pickup.location.addressZipCode}<br/>
            </address>
            <div className="btn-group mb-3">
              {pickup.contactWhatsapp && <a className="btn btn-sm btn-outline-primary" href={pickup.contactWhatsapp} target="_blank">Join WhatsApp Group</a>}
              {pickup.contactUrl && <a className="btn btn-sm btn-outline-primary" href={pickup.contactUrl} target="_blank">View Website</a>}
              {pickup.contactEmail && <a className="btn btn-sm btn-outline-primary" href={`mailto:${pickup.contactEmail}`} target="_blank">Send Email</a>}
              {pickup.contactPhone && <a className="btn btn-sm btn-outline-primary" href={`tel:${pickup.contactPhone}`}>Call Phone</a>}
              <a className="btn btn-sm btn-outline-primary" href={`https://www.google.com/maps/place/${pickup.location.addressStreet + ' ' + pickup.location.addressCity + ' ' + pickup.location.addressState + ' ' + pickup.location.addressZipCode}`} target="_blank">View on Map</a>
            </div>
          </article>
          <div className="col-md-6">
            <section id="pickup-listing-map" style={{ height: '400px' }} dangerouslySetInnerHTML={{
              __html: ''
            }}></section>
          </div>
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
            '<p><b>' + game.location.type.toUpperCase() + ': </b>' + game.description + '</p>' +
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
