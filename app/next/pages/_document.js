import NextDocument, { Html, Head, Main, NextScript } from 'next/document'
import { FooterNavigation } from '../components/Navigation'

class SFLUltimateDocument extends NextDocument {
  static async getInitialProps (context) {
    const initialProps = await NextDocument.getInitialProps(context)
    return { ...initialProps, pathname: context.pathname }
  }

  render (props) {
    if (this.props.pathname === '/sheets') {
      return <>
        <Html lang="en">
          <Head />
          <Main/>
          <NextScript/>
        </Html>
      </>
    }

    const section = ''
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8"/>
          <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
          <meta property="og:type" content="website"/>
          <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>
          <link rel="stylesheet" href="/styles/font-awesome/font-awesome.min.css"/>
          <link rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Roboto+Condensed:400,700,700i|Roboto:300,400,400i,700"/>
          <link rel="stylesheet" href="/styles/site.css"/>
          <script dangerouslySetInnerHTML={{
            __html: `
            // Facebook Pixel Code
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '2012250958870227');
            fbq('track', 'PageView');
            //- End Facebook Pixel Code
            `
          }}/>
          <noscript>
            <img src="https://www.facebook.com/tr?id=2012250958870227&ev=PageView&noscript=1" height="1" width="1"
              style={{ display: 'none' }}/>
          </noscript>
        </Head>
        <body>
          <Main/>
          <NextScript/>
          <FooterNavigation />
          <div id="fb-root"></div>
          <div id="fb-customer-chat" className="fb-customer-chat"></div>

          <script dangerouslySetInnerHTML={{
            __html: `
          //- Google Analytics Tracking
          (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject'] = r;i[r]=i[r]||function(){
          (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
          m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

          ga('create', 'UA-73207322-1', 'auto');
          ga('send', 'pageview');
        `
          }}/>
          <script dangerouslySetInnerHTML={{
            __html: `
            var chatbox = document.getElementById('fb-customer-chat');
            chatbox.setAttribute("page_id", "353781541319975");
            chatbox.setAttribute("attribution", "biz_inbox");
            window.fbAsyncInit = function () {
              FB.init({
                xfbml: true,
                version: 'v12.0'
              });
            };
            (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s);
            js.id = id;
            js.src = 'https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js';
            fjs.parentNode.insertBefore(js, fjs);
          }(document, 'script', 'facebook-jssdk'));
            `
          }}/>
        </body>
      </Html>
    )
  }
}

export default SFLUltimateDocument
