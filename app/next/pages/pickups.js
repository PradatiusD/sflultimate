import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import { gql } from '@apollo/client'
import GraphqlClient from '../lib/graphql-client'
import { HeaderNavigation } from '../components/Navigation'
import PickupContactActions from '../components/PickupContactActions'
import { updateWithGlobalServerSideProps } from '../lib/global-server-side-props'
import { SOUTH_FLORIDA_ZIP_COORDINATES } from '../lib/south-florida-zip-coordinates'

const GOOGLE_MAPS_API_KEY = 'AIzaSyDld-_TKoN-4PGLgQ1-JwN607eT4RfAMSQ'
const GOOGLE_MAPS_SCRIPT_ID = 'pickup-google-maps-script'
const DEFAULT_MAP_CENTER = { lat: 26.076477, lng: -80.252113 }
const DEFAULT_MAP_ZOOM = 8

function hasCoordinates (pickup) {
  return Boolean(
    pickup &&
    pickup.location &&
    typeof pickup.location.latitude === 'number' &&
    typeof pickup.location.longitude === 'number'
  )
}

function toRadians (degrees) {
  return degrees * (Math.PI / 180)
}

function getDistanceInMiles (pointA, pointB) {
  const earthRadiusInMiles = 3958.8
  const latitudeDelta = toRadians(pointB.lat - pointA.lat)
  const longitudeDelta = toRadians(pointB.lng - pointA.lng)
  const latitudeA = toRadians(pointA.lat)
  const latitudeB = toRadians(pointB.lat)

  const haversineValue = Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(latitudeA) * Math.cos(latitudeB) *
    Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2)

  const angularDistance = 2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))

  return earthRadiusInMiles * angularDistance
}

function getPickupDistanceFromOrigin (pickup, origin) {
  if (!hasCoordinates(pickup) || !origin) {
    return null
  }

  return getDistanceInMiles(origin, {
    lat: pickup.location.latitude,
    lng: pickup.location.longitude
  })
}

function getSouthFloridaSortOrigin (zipCode) {
  const coordinate = SOUTH_FLORIDA_ZIP_COORDINATES.find((item) => item.zipCode === zipCode)

  if (!coordinate) {
    return null
  }

  return {
    lat: coordinate.lat,
    lng: coordinate.lng,
    zipCode
  }
}

function sortPickupsByDistance (pickupList, origin) {
  return pickupList
    .map((pickup) => ({
      ...pickup,
      distanceMiles: getPickupDistanceFromOrigin(pickup, origin)
    }))
    .sort((pickupA, pickupB) => {
      const pickupADistance = pickupA.distanceMiles
      const pickupBDistance = pickupB.distanceMiles

      if (pickupADistance === null && pickupBDistance === null) {
        return pickupA.order - pickupB.order
      }

      if (pickupADistance === null) {
        return 1
      }

      if (pickupBDistance === null) {
        return -1
      }

      if (pickupADistance === pickupBDistance) {
        return pickupA.order - pickupB.order
      }

      return pickupADistance - pickupBDistance
    })
}

function buildInfoWindowContent (pickup) {
  return '' +
    '<div id="content">' +
    '<div id="siteNotice"></div>' +
    '<h4 id="firstHeading" class="firstHeading">' + pickup.title + '</h4>' +
    '<p class="text-muted"><b>' + pickup.day + ' at ' + pickup.time + '</b></p>' +
    '<p><b>' + pickup.location.type.toUpperCase() + ': </b>' + pickup.description + '</p>' +
    '<div id="bodyContent">' +
    '' + pickup.location.addressStreet + '<br>' + pickup.location.addressCity + ', ' + pickup.location.addressState + ', ' + pickup.location.addressZipCode + '<br>' +
    '</div>'
}

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
          query {
            allPickups(where: {isActive: true}, sortBy: order_ASC) {
              id
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

  const props = {
    pickups: results.data.allPickups.map((pickup) => ({
      id: pickup.id,
      slug: pickup.slug,
      title: pickup.title,
      order: pickup.order,
      day: pickup.day,
      time: pickup.time,
      description: pickup.description,
      location: pickup.location,
      contactUrl: pickup.contactUrl,
      hasContactWhatsapp: Boolean(pickup.contactWhatsapp),
      hasContactEmail: Boolean(pickup.contactEmail),
      hasContactPhone: Boolean(pickup.contactPhone)
    }))
  }
  await updateWithGlobalServerSideProps(props)
  return { props }
}

export default function PickupsPage (props) {
  const { pickups, leagues } = props
  const [zipCode, setZipCode] = useState('')
  const [displayPickups, setDisplayPickups] = useState(pickups)
  const [sortOrigin, setSortOrigin] = useState(null)
  const [sortError, setSortError] = useState('')
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false)
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const infoWindowsRef = useRef([])

  useEffect(() => {
    setDisplayPickups(pickups)
  }, [pickups])

  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsGoogleMapsReady(true)
      return
    }

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID)

    if (existingScript) {
      existingScript.addEventListener('load', handleGoogleMapsLoad)
      return () => existingScript.removeEventListener('load', handleGoogleMapsLoad)
    }

    const script = document.createElement('script')
    script.id = GOOGLE_MAPS_SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`
    script.async = true
    script.addEventListener('load', handleGoogleMapsLoad)
    document.body.appendChild(script)

    return () => script.removeEventListener('load', handleGoogleMapsLoad)
  }, [])

  useEffect(() => {
    if (!isGoogleMapsReady || !mapElementRef.current || !window.google || !window.google.maps) {
      return
    }

    const google = window.google

    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(mapElementRef.current, {
        zoom: DEFAULT_MAP_ZOOM,
        center: DEFAULT_MAP_CENTER
      })
    }

    markersRef.current.forEach((marker) => marker.setMap(null))
    infoWindowsRef.current.forEach((infoWindow) => infoWindow.close())
    markersRef.current = []
    infoWindowsRef.current = []

    const bounds = new google.maps.LatLngBounds()
    let hasBounds = false

    if (sortOrigin) {
      const originMarker = new google.maps.Marker({
        map: mapRef.current,
        position: sortOrigin,
        title: `Zip code ${sortOrigin.zipCode}`,
        label: 'Y'
      })

      const originInfoWindow = new google.maps.InfoWindow({
        content: `<strong>Your zip code:</strong> ${sortOrigin.zipCode}`
      })

      originMarker.addListener('click', function () {
        infoWindowsRef.current.forEach(function (infoWindowItem) {
          infoWindowItem.close()
        })
        originInfoWindow.open(mapRef.current, originMarker)
      })

      markersRef.current.push(originMarker)
      infoWindowsRef.current.push(originInfoWindow)
      bounds.extend(sortOrigin)
      hasBounds = true
    }

    displayPickups.forEach(function (pickup) {
      if (!hasCoordinates(pickup)) {
        return
      }

      const infoWindow = new google.maps.InfoWindow({
        content: buildInfoWindowContent(pickup)
      })

      const marker = new google.maps.Marker({
        map: mapRef.current,
        position: {
          lat: pickup.location.latitude,
          lng: pickup.location.longitude
        },
        title: pickup.title
      })

      marker.addListener('click', function () {
        infoWindowsRef.current.forEach(function (infoWindowItem) {
          infoWindowItem.close()
        })
        infoWindow.open(mapRef.current, marker)
      })

      markersRef.current.push(marker)
      infoWindowsRef.current.push(infoWindow)
      bounds.extend(marker.getPosition())
      hasBounds = true
    })

    if (hasBounds) {
      mapRef.current.fitBounds(bounds)
    } else {
      mapRef.current.setCenter(DEFAULT_MAP_CENTER)
      mapRef.current.setZoom(DEFAULT_MAP_ZOOM)
    }
  }, [displayPickups, isGoogleMapsReady, sortOrigin])

  function handleGoogleMapsLoad () {
    setIsGoogleMapsReady(true)
  }

  function onZipCodeChange (event) {
    setZipCode(event.target.value.replace(/\D/g, '').slice(0, 5))
  }

  function resetZipSorting () {
    setZipCode('')
    setSortOrigin(null)
    setSortError('')
    setDisplayPickups(pickups)
  }

  function sortByZipCode (event) {
    event.preventDefault()
    setSortError('')

    if (zipCode.length !== 5) {
      setSortOrigin(null)
      setDisplayPickups(pickups)
      setSortError('Enter a valid 5-digit zip code to sort pickups by distance.')
      return
    }

    const nextSortOrigin = getSouthFloridaSortOrigin(zipCode)

    if (!nextSortOrigin) {
      setSortOrigin(null)
      setDisplayPickups(pickups)
      setSortError('That zip code is not in our South Florida lookup yet. Please use a Miami-Dade, Broward, or Palm Beach zip code.')
      return
    }

    setSortOrigin(nextSortOrigin)
    setDisplayPickups(sortPickupsByDistance(pickups, nextSortOrigin))
  }

  return (
    <>
      <Head>
        <title>Local Broward, Palm Beach, & Miami-Dade County Pickups</title>
        <meta property="og:title" content="Local Broward, Palm Beach, & Miami-Dade County Pickups"/>
        <meta property="og:url" content="https://www.sflultimate.com/pickups"/>
        <meta property="og:description"
          content="Learn about the local days, times, and locations for ultimate frisbee pickup near you in South Florida!"/>
        <meta property="og:image" content="https://www.sflultimate.com/images/dave-catching-face.jpg"/>
      </Head>
      <HeaderNavigation leagues={leagues} />

      <div className="container pickup-listing-page">
        <section>
          <h1>Our Ultimate Community</h1>
          <p className="lead">Read below to find all the local pickups taking place in the Broward, Palm Beach, &
            Miami-Dade County areas.</p>
        </section>
        <div className="alert alert-info" role="alert">
          <strong>How is this pickup list generated/updated?</strong><br/> We try our best to keep an accurate,
          up-to-date list, but as pickups grow and fade out we do sometimes not reflect the most up to date data. Have a
          suggestion or correction? Email <a href="mailto:sflultimate@gmail.com">sflultimate@gmail.com</a> with your
          suggestion and we&#39;ll take care of updating it.
        </div>

        <div className="alert alert-warning" role="alert">
          <strong>Reach Out Before You Play</strong><br/>Please reach out to the pickup before heading there to play.
          Due to weather, turnout, or competing local events/tournaments, sometimes pickups do not happen, so it&#39;s best
          to get confirmation from the pickup organizer before heading there to play.
        </div>

        <section className="pickup-zip-sorter card card-body bg-light">
          <form className="row g-3 align-items-end" onSubmit={sortByZipCode}>
            <div className="col-sm-6 col-md-4">
              <label className="form-label" htmlFor="pickup-zip-code">Put your zip code in</label>
              <input
                id="pickup-zip-code"
                className="form-control"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                placeholder="33101"
                value={zipCode}
                onChange={onZipCodeChange}
              />
            </div>
            <div className="col-sm-auto">
              <button className="btn btn-primary" type="submit">Sort by Distance</button>
            </div>
            <div className="col-sm-auto">
              <button className="btn btn-outline-secondary" type="button" onClick={resetZipSorting}>
                Reset
              </button>
            </div>
          </form>
          <p className="text-muted mb-0 mt-2">Enter a South Florida zip code to bring the closest pickups to the top of the list.</p>
          {sortOrigin && (
            <p className="mb-0 mt-2"><strong>Sorted by distance from {sortOrigin.zipCode}.</strong></p>
          )}
          {sortError && (
            <p className="text-danger mb-0 mt-2">{sortError}</p>
          )}
        </section>

        <h2 className="mt-4">Local Map</h2>

        <section id="pickup-listing-map" ref={mapElementRef}></section>

        <h2 className="mt-3">Full List</h2>
        {
          displayPickups.map((pickup, index) => {
            return (
              <article key={pickup.id}>
                <hr/>
                <div className="row">
                  <div className="col-sm-8">
                    <h3><a href={'/pickups/' + pickup.slug}>{pickup.title}</a></h3>
                    <small>{pickup.day} at {pickup.time}</small>
                    <p>{pickup.description}</p>
                  </div>
                  <div className="col-sm-4">
                    {
                      pickup.location && (
                        <address>
                          <strong>{pickup.location.name}</strong>
                          <span className="badge bg-primary">{pickup.location.type}</span>
                          <br/>
                          {pickup.location.addressStreet}<br/>
                          {pickup.location.addressCity}, {pickup.location.addressState}, {pickup.location.addressZipCode}<br/>
                          {typeof pickup.distanceMiles === 'number' && (
                            <span className="pickup-distance text-muted d-inline-block mt-2">
                              {pickup.distanceMiles.toFixed(1)} miles away
                            </span>
                          )}
                        </address>
                      )
                    }
                    <PickupContactActions pickup={pickup} />
                    {
                      index + 1 > displayPickups.length && <hr/>
                    }
                  </div>
                </div>
              </article>
            )
          })
        }
      </div>
    </>
  )
}
