import Head from 'next/head'
import { HeaderNavigation } from '../components/Navigation'

export default function Privacy () {
  return (
    <>
      <Head>
        <meta property="og:title" content="South Florida Ultimate Inc. Privacy Policy" />
        <meta property="og:url" content="https://www.sflultimate.com/privacy" />
        <meta property="og:image" content="https://www.sflultimate.com/images/open-graph/homepage.jpg" />
        <meta property="og:description" content="View our privacy policy" />
      </Head>
      <HeaderNavigation />
      <div className="container">
        <div className="row">
          <div className="col-sm-8 offset-sm-2">
            <h1>Privacy Policy</h1>

            <p> This privacy policy discloses the privacy practices for sflultimate.com. This privacy policy applies solely to information collected by this web site. It will notify you of the following:</p>
            <ul>
              <li> What personally identifiable information is collected from you through the web site, how it is used and
              with whom it may be shared.
              </li>
              <li> What choices are available to you regarding the use of your data.</li>
              <li> The security procedures in place to protect the misuse of your information.</li>
              <li> How you can correct any inaccuracies in the information.</li>
            </ul>

            <h3> Information Collection, Use, and Sharing</h3>
            <p> We are the sole owners of the information collected on this site. We only have access to/collect
            information that you voluntarily give us via email or other direct contact from you. We will not sell or
            rent this information to anyone.</p>
            <p> We will use your information to respond to you, regarding the reason you contacted us. We will not share your information with any third party outside of our organization, other than as necessary to fulfill your request, e.g. to process a payment.</p>
            <p> Unless you ask us not to, we may contact you via email in the future to tell you regarding changes to this privacy policy.</p>

            <h3> Your Access to and Control Over Information</h3>
            <p> You may opt out of any future contacts from us at any time. You can do the following at any time by contacting us via the email address or phone number given on our website:</p>

            <ul>
              <li> See what data we have about you, if any.</li>
              <li> Change/correct any data we have about you.</li>
              <li> Have us delete any data we have about you.</li>
              <li> Express any concern you have about our use of your data.</li>
            </ul>

            <h3> Security</h3>
            <p> We take precautions to protect your information. When you submit sensitive information via the website,
            your information is protected both online and offline.</p>
            <p> Wherever we collect sensitive information (such as credit card data), that information is encrypted and transmitted to Braintree payments and never actually stored on our servers.</p>
            <p> While we use encryption to protect sensitive information transmitted online, we also protect your information offline. Only employees who need the information to perform a specific job (for example, billing or customer service) are granted access to personally identifiable information. The computers/servers in which we store personally identifiable information are kept in a securely managed environment.</p>

            <h3> Updates</h3>
            <p> Our Privacy Policy may change from time to time and all updates will be posted on this page.</p>
          </div>
        </div>
      </div>
    </>
  )
}
