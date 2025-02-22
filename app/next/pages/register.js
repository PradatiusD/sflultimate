import { useState } from 'react'
import { gql } from '@apollo/client'
import Head from 'next/head'
import GraphqlClient from '../lib/graphql-client'
import PaymentUtils from '../lib/payment-utils'
import {useEffect} from "react";

function FormInput ({ label, type, name, placeholder, required, helpText, onChange }) {
  return <>
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        className="input-lg form-control"
        type={type}
        name={name}
        placeholder={placeholder || ''}
        required={required}
        onChange={onChange}
      />
      <p className="help-block">{helpText}</p>
    </div>
  </>
}

function FormSelect ({ label, name, options, required, helpText, onChange }) {
  return <>
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <select
        id={name}
        className="input-lg form-control"
        name={name}
        required={required}
        onChange={onChange}
      >
        <option value="">Please Select</option>
        {options.map((option, i) => <option key={i} value={option.value}>{option.label}</option>)}
      </select>
      <p className="help-block">{helpText}</p>
    </div>
  </>
}

export const getServerSideProps = async () => {
  const results = await GraphqlClient.query({
    query: gql`
      query {
        allLeagues(where: {isActive: true}) {
          id
          title
          description
          registrationStart
          registrationEnd
          pricingEarlyAdult
          pricingEarlyStudent
          pricingRegularAdult
          pricingRegularStudent
          pricingLateStudent
          pricingLateAdult
          finalsTournamentDescription
          finalsTournamentEndDate
          finalsTournamentStartDate
          registrationShareImage {
            publicUrl
          }
        }
      }`
  })
  const league = results.data.allLeagues[0]
  const token = await PaymentUtils.generateGatewayClientToken()
  return { props: { league, braintreeToken: token } }
}

const locals = {}
locals.formatDate = function (date) {
  return new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/New_York' })
}

locals.formatTime = function (date) {
  return new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })
}

export default function RegisterPage (props) {
  const { league: activeLeague, braintreeToken} = props
  const [player, setPlayer] = useState({})

  useEffect(() => {
    braintree.dropin.create({authorization: BRAINTREE_CLIENT_TOKEN, selector: '#payment-form'}, function (err, instance) {
      document.querySelector('#submitButton').addEventListener('click', function (e) {
        e.preventDefault()
        instance.requestPaymentMethod(function (err, payload) {
          document.querySelector('#nonce').value = payload.nonce
          document.querySelector('form').submit()
        });
      })
    });
  }, []);
  
  const adultPrice = activeLeague.pricingRegularAdult
  const studentPrice = activeLeague.pricingRegularStudent
  
  // if locals.league.isEarlyRegistrationPeriod
  //    option(value='Adult')="Adult - $" + fees.earlyAdult
  //    option(value='Student')="Student - $" + fees.earlyStudent
  // else if locals.league.isRegistrationPeriod
  //    option(value='Adult')="Adult - $" + fees.regularAdult
  //    option(value='Student')="Student - $" + fees.regularStudent
  // else if locals.league.isLateRegistrationPeriod
  //    option(value='Adult')="Adult - $" + fees.lateAdult
  //    option(value='Student')="Student - $" + fees.lateStudent


  return <>
    <Head>
      <meta property="og:title" content={'Register now for the SFL Ultimate ' + activeLeague.title}/>
      <meta property="og:url" content="https://www.sflultimate.com/register"/>
      <meta property="og:description" content={activeLeague.finalsTournamentDescription || ''}/>
      {
        activeLeague.registrationShareImage && activeLeague.registrationShareImage.publicUrl && (
          <meta property="og:image" content={activeLeague.registrationShareImage.publicUrl}/>
        )
      }

      <script src="https://js.braintreegateway.com/web/dropin/1.44.1/js/dropin.min.js"/>
      <script src="https://www.google.com/recaptcha/api.js?render=6Ld6rNQUAAAAAAthlbLL1eCF9NGKfP8-mQOHu89w"/>
      <script dangerouslySetInnerHTML={{__html: `var BRAINTREE_CLIENT_TOKEN = '${braintreeToken}';`}}></script>
    </Head>
    <div className="container register">
      <h1>{activeLeague.title} Sign Up</h1>
      <h3>Registration</h3>
      
      <div dangerouslySetInnerHTML={{__html: activeLeague.description}}/>
      <p>
        Regular registration is open <strong>as of {locals.formatDate(activeLeague.registrationStart)}</strong> and ends
        on <strong>{locals.formatDate(activeLeague.registrationEnd)}</strong>
      </p>

      <div className="row">
        <div className="col-md-12">
          <form id="registration" method="POST" action="/api/register">
            <input type="hidden" name="league" value={activeLeague.id}/>
            <input type="hidden" name="payment_method_nonce" id="nonce"/>

            <pre>{JSON.stringify(player)}</pre>
            <div className="row">
              <div className="col-md-6">
                <FormInput
                  label="First Name"
                  id="firstName"
                  name="firstName"
                  placeholder=""
                  required
                  onChange={(e) => setPlayer({...player, firstName: e.target.value})}
                />
              </div>
              <div className="col-md-6">
                <FormInput
                  label="Last Name"
                  id="lastName"
                  name="lastName"
                  placeholder=""
                  required
                  onChange={(e) => setPlayer({...player, lastName: e.target.value})}
                />
              </div>
            </div>

            <FormSelect
              label="Gender"
              name="gender"
              options={[
                {value: 'Female', label: 'Female'},
                {value: 'Male', label: 'Male'},
                {value: 'Other', label: 'Other / I\'d Prefer Not To'}
              ]}
              helpText={'We use this information to draft teams that have even gender distributions.}'}
              onChange={(e) => setPlayer({...player, gender: e.target.value})}
            />

            <FormInput
              label="Email Address"
              id="email"
              type="email"
              name="email"
              required
              helpText={'We use your e-mail to send you updates and league information through the email you provide here.'}
              onChange={(e) => setPlayer({...player, email: e.target.value})}
            />

            <FormInput
              label="Phone Number"
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              helpText={'Not required, but often our captains find reaching out via SMS/GroupMe/WhatsApp is much better than email.  Your number would be shared with your team.'}
              onChange={(e) => setPlayer({...player, phoneNumber: e.target.value})}
            />

            <FormInput
              label="Age (In Years)"
              id="age"
              name="age"
              type="number"
              helpText={'Our insurance policy requires us to report how many people within certain age-ranges exist in the league.  We do not ask for your birthdate to protect your privacy.'}
              onChange={(e) => setPlayer({...player, age: e.target.value})}
            />

            <FormSelect
              label="Skill Level"
              id="skillLevel"
              name="skillLevel"
              options={[
                {value: 1, label: '1 - Absolute Beginner - never played before'},
                {value: 2, label: '2 - Hey wait, what\'s a flick?'},
                {value: 3, label: '3 - Working on throws, basic knowledge of the game'},
                {value: 4, label: '4 - Pick-up player, okay throws'},
                {value: 5, label: '5 - Decent backhand & forehand. Little to no club experience'},
                {value: 6, label: '6 - Fairly solid backhand & forehand. Some club experience'},
                {value: 7, label: '7 - Tourney experience. Several years of club'},
                {value: 8, label: '8 - Club level, solid all around, not prone to errors'},
                {value: 9, label: '9 - Rock star. spot on throws, awesome D'}

              ]}
              helpText="Consider throwing accuracy, defensive abilities, agility and game awareness when choosing a skill level. <strong>Please choose HONESTLY</strong> as this helps captains to accurately draft a balanced team."
              onChange={(e) => setPlayer({...player, skillLevel: e.target.value})}
            />

            <FormInput
              label="Partner Name"
              id="partnerName"
              name="partnerName"
              helpText={'Type the name of the person you would like to partner with.  The captains during the draft will make every effort to accommodate this request, but we can\'t guarantee this.'}
              onChange={(e) => setPlayer({...player, partnerName: e.target.value})}
            />

            <FormSelect
              label="Registration Type"
              id="registrationLevel"
              name="registrationLevel"
              options={[
                {value: 'Adult', label: `Adult - $${adultPrice}`},
                {value: 'Student', label: `Student - $${studentPrice}`}
              ]}
              onChange={(e) => setPlayer({...player, registrationLevel: e.target.value})}
            />

            <div id="payment-form"></div>

            <div className="text-center">
              <button className="btn btn-default btn-lg btn-primary" type="submit" id="submitButton">Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </>
}

//
//     if locals.league.canRegister
//             if err
//                 br
//                 .alert.alert-danger
//                     strong Error:
//                     span=err
//             br
//             br
//
//             br
//
//             if locals.league.lateRegistrationStart && locals.league.lateRegistrationEnd
//               .alert.alert-info
//                | Late registration (at a $#{locals.fees.lateAdult} fee for adults, $#{locals.fees.lateStudent} for students, as space permits) starts
//                | #{formatDate(locals.league.lateRegistrationStart)} until #{formatDate(locals.league.lateRegistrationEnd)} at #{formatTime(locals.league.lateRegistrationEnd)}. This will not include a jersey.
//

//                 div#playerPositions
//                     label(for="skillLevel") Preferred Player Positions
//                     p.help-block This is to help captains draft, especially in cases where we captains might not know you.  Check all that apply.  You must pick one.
//                 .checkbox(style="margin-top: 0")
//                     label
//                         input#playerPositionHandler(type='checkbox' name="preferredPositions" value="handler")
//                         | <strong>Handler</strong>: I'm confident/patient with my throws and know how to move the disc around the field in the wind or against the zone.
//                 .checkbox
//                     label
//                         input#playerPositionCutter(type='checkbox' name="preferredPositions" value="cutter")
//                         | <strong>Cutter</strong>: I love getting open constantly on offense, whether it is in the short game or cutting deep for a big throw.
//                 .checkbox
//                     label
//                         input#playerPositionHybrid(type='checkbox' name="preferredPositions" value="hybrid")
//                         | <strong>Hybrid</strong>: I feel comfortable handling the disc or cutting on offense, and can play on either depending on what the team needs.
//                 .checkbox
//                     label
//                         input#playerPositionDefense(type='checkbox' name="preferredPositions" value="defense")
//                         | <strong>Defense</strong>: I love playing hard on defense and really enjoy covering great cutters/handlers.
//
//                 .alert.alert-danger#playerPositionError Please pick <strong>at least one</strong> of the above.
//
//                 if locals.league.requestAttendance
//                     .form-group
//                         label(for="participation") Expected Attendance
//                         select#participation.input-lg.form-control(name="participation")
//                             option(value="30") Less than 30% (miss #{Math.floor(league.numberOfWeeksOfPlay*0.7)}+ weeks of play)
//                             option(value="50") Around 50% (miss #{Math.floor(league.numberOfWeeksOfPlay*0.5)} weeks of play)
//                             option(value="80" selected="selected") Greater than 80% (miss #{Math.floor(league.numberOfWeeksOfPlay*0.2)} week of play)
//                         p.help-block Knowing how often you plan on being there helps captains pick well-rounded teams.  If you have specific dates you will be out, be sure to place that in the comments.
//                 else
//                     #no-requestAttendance
//
//                 div
//                     label(for="skillLevel") Finals attendance
//                 .checkbox(style="margin-top: 0")
//                     label
//                         input#willAttendFinals(type='checkbox' name='willAttendFinals')
//                         | I expect to be able to attend finals.
//
//                 if locals.league.requestShirtSize
//                     .form-group
//                         label(for="shirtSize") Shirt Size
//                         if locals.league.jerseyDesign
//                             img.img-responsive(src=locals.league.jerseyDesign.url style="max-width: 300px")
//                         select#shirtSize.input-lg.form-control(name="shirtSize")
//                             option(value="XS") XS
//                             option(value="S") S
//                             option(value="M") M
//                             option(value="L") L
//                             option(value="XL") XL
//                             option(value="XXL") XXL
//                             option(value="NA") I do not want a jersey
//                         if locals.league.jerseyDesign
//                             p.help-block The above is the current design for this league, which will in color depending on what team you are on.
//                 else
//                     #no-requestShirtSize
//
//                   br
//
//
//                 .form-group.hide
//                     label(for='usauNumber') USAU Number
//                     input#usauNumber.input-lg.form-control(type='text' name='usauNumber' placeholder='')
//                     p.help-block We are trying to find out how many of our players are on USAU to see if we can use that insurance instead.
//
//                 .form-group
//                     label Comments
//                     textarea#comments(name="comments").form-control
//                     p.help-block Type here any additional comments you may have (if you can't attend certain weeks, really don't want to play with a specific person, or want to give captains some idea of who you are go ahead).  The captains and organizers will use this information during the player draft.
//
//                 .form-group
//                     label(for="wouldCaptain") Would you like to be a captain or co-captain?
//                     select#wouldCaptain.input-lg.form-control(name="wouldCaptain")
//                         option(value='No') No
//                         option(value='Yes') Yes
//
//                 p.help-block If your captain and your team wins the league, you'll have your name and team's name be featured on our league trophy.  Captains get to pick their teams in the draft and are responsible for communicating to their teams on a weekly basis as well as ensuring that games maintain fair, spirited, competitive, and fun play.
//
//                 h3 General Waiver
//                 .checkbox
//                     label
//                         input#termsConditions(type='checkbox' name='termsConditions' required)
//                         | I agree to SFLUltimate's <a data-toggle="modal" data-target="#waiver">terms & conditions</a>.
//
//                 h3 SFLUltimate Player Code of Conduct
//                 .checkbox
//                     label
//                         input#codeOfConduct1(type='checkbox' required)
//                         | I will foster Spirit of the Game with the aim of creating an inclusive and sportsmanlike environment.
//                 .checkbox
//                     label
//                         input#codeOfConduct2(type='checkbox' required)
//                         | I will facilitate the growth of the sport through mentorship and coaching of novice players.
//                 .checkbox
//                     label
//                         input#codeOfConduct3(type='checkbox' required)
//                         | I will improve my skills in a safe and supportive environment, including avoiding dangerous plays.
//                 .checkbox
//                     label
//                         input#codeOfConduct4(type='checkbox' required)
//                         | I will take this as an opportunity to make new friends and to get inspired to join club teams.
//                 if locals.league.requestSponsorship
//                     h3 Sponsorship
//                     .checkbox
//                         label
//                             input#wouldSponsor(type='checkbox' name='wouldSponsor')
//                             | I am interested in having my company logo on the SFLUltimate jersey and be a sponsor.
//                 else
//                     #no-requestSponsorship
//
//                 if locals.league.isLateRegistrationPeriod
//                     h3 Late Registration
//                     .checkbox
//                         label
//                             input#understandsLateFee(type='checkbox' required)
//                             | I understand that since my registration is late, I may not be provided a jersey. Until I am cleared by SFL Ultimate to play and assigned a team I will not attend.  If for any reason SFLUltimate cannot find me a team due to spacing limitations, SFL Ultimate will refund me.
//                 else
//                     #no-understandsLateFee
//
//
//                 h3 Payment Information
//                 input(id="recaptcha" name='recaptchaToken' type='hidden')
//

//
//                 .form-group
//                     label(for="streetAddress") Street Address
//                     input#streetAddress.input-lg.form-control(type='text' name='streetAddress' placeholder='' required)
//                     p.help-block If you plan on paying with card (so no PayPal) type here just your street address (So 12345 Palm Tree Ave.). Do not pass city/zip code or apt number. We do not store this information, but send it to the payment processor for fraud prevention.
//
//                 #payment-form
//
//         .modal.fade(tabindex='-1', role='dialog' id='waiver')
//             .modal-dialog.modal-lg
//                 .modal-content
//                     .modal-header
//                         button.close(type='button', data-dismiss='modal', aria-label='Close')
//                             span(aria-hidden='true') ×
//                         h4.modal-title Waiver
//                     .modal-body
//                         p
//                             | 1. In consideration for receiving permission to participate in the South Florida Ultimate Spring League I hereby <strong>release, waive, discharge, and convenant not to sue</strong> South Florida Ultimate, their officers, agents, or employees (hereinafter referred to as <strong>releasees</strong>) from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury, including death, that may be sustained by me, or to any property belonging to me, while participating in such activity, while in, on or upon the premises where the activities are being conducted, <strong>regardless of whether such loss is caused by the negligence of the releasees</strong>, or otherwise and regardless of whether such liability arises in tort, contract, strict liability, or otherwise, to the fullest extent allowed by law.
//                         p
//                             | 2. I am fully aware of the risks and hazards connected with the activities of Ultimate, and I am aware that such activities include the risk of injury and even death, and I hereby elect to voluntarily participate in said activities, knowing that the activities may be hazardous to my property and me. I understand that South Florida Ultimate does not require me to participate in this activity. I voluntarily assume full responsibility for any risks of loss, property damage, or personal injury, including death, that may be sustained by me, or any loss or damage to property owned by me, as a result of being engaged in such an activities, <strong>whether caused by the negligence of releasees</strong> or otherwise, to the fullest extent allowed by law.
//                         p
//                             | 3. I further hereby <strong>agree to indemnify and hold harmless the releasees</strong> from any loss, liability, damage, or costs, including court costs and attorneys' fees that Releases may incur due to my participation in said activities, <strong>whether caused by the negligence of releasees</strong> or otherwise, to the fullest extent allowed by law.
//                         p
//                             | 4. It is my express intent that this Waiver and Hold Harmless Agreement shall bind the members of my family and spouse, if I am alive, and my heirs, assigns and personal representative, if I am deceased, and shall be deemed as a <strong>release, waiver, discharge, and covenant not to sue</strong> the above-named RELEASEES. I hereby further agree that this Waiver of Liability and Hold Harmless Agreement shall be construed in accordance with the laws of the State of Florida and that any mediation, suit, or other proceeding must be filed or entered into only in Florid and the federal or state courts of Maryland. Any portion of this document deemed unlawful or unenforceable is severable and shall be stricken without any effect on the enforceability of the remaining provisions.
//                         p
//                             | <strong>In completing this registration, I acknowledge and represent that</strong> I have read the foregoing Wavier of Liability and Hold Harmless Agreement, understand it and sign it voluntarily as my own free act and deed; no oral representations, statements, or inducements, apart from the foregoing written agreement, have been made; I am at least eighteen (18) years of age and fully competent; and I execute this Agreement for full, adequate and complete consideration fully intending to be bound by same.
//                     .modal-footer
//                         button.btn.btn-primary(type='button', data-dismiss='modal') Close
//
//     else
//         .container.register: .row: .col-md-12
//             h1 The Registration for #{locals.league.title} has closed
//             p="If you wish to be considered for late registration ($"+fees.lateAdult+" for adults, $"+fees.lateStudent+" for students), contact sflultimate@gmail.com. Late registration will be considered on a weekly basis as space permits."
//             p Note that you will not get a jersey.
//
// block js
//     script.
//         var clientToken = "#{braintree_token}";
//     script(src='js/register-form.js')

// const nodemailer = require('nodemailer')
//
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASSWORD
//   }
// })
//
// module.exports = async function (req, res) {
//   PaymentUtils.setBaseRegistrationLocals(view, res)
//
//   view.on('post', async function (next) {
//     // Cast to boolean
//     req.body.wouldCaptain = req.body.wouldCaptain === 'Yes'
//
//     const {
//       comments,
//       email,
//       firstName,
//       gender,
//       lastName,
//       participation,
//       age,
//       ageGroup,
//       phoneNumber,
//       usauNumber,
//       wouldCaptain,
//       partnerName,
//       registrationLevel,
//       recaptchaToken,
//       skillLevel,
//       shirtSize,
//       streetAddress,
//       wouldSponsor,
//       willAttendFinals,
//       preferredPositions
//     } = req.body
//
//     const paymentMethodNonce = req.body.payment_method_nonce
//
//     try {
//       const recaptchaResponse = await PaymentUtils.validateRecaptchaToken(recaptchaToken)
//       if (recaptchaResponse && recaptchaResponse.score <= 0.5) {
//         locals.err = 'Unauthorized transaction, we believe you are a bot.  Please contact sflultimate@gmail.com.'
//         return next()
//       }
//     } catch (err) {
//       locals.err = JSON.stringify(err)
//       return next()
//     }
//
//     let amount
//
//     if (locals.league.isEarlyRegistrationPeriod) {
//       amount = registrationLevel === 'Student' ? locals.fees.earlyStudent : locals.fees.earlyAdult
//     } else if (locals.league.isRegistrationPeriod) {
//       amount = registrationLevel === 'Student' ? locals.fees.regularStudent : locals.fees.regularAdult
//     } else if (locals.league.isLateRegistrationPeriod) {
//       amount = registrationLevel === 'Student' ? locals.fees.lateStudent : locals.fees.lateAdult
//     }
//       const newPlayerRecord = {
//         leagues: [
//           locals.league._id
//         ],
//         gender,
//         skillLevel,
//         comments,
//         shirtSize,
//         participation,
//         partnerName,
//         wouldCaptain,
//         registrationLevel,
//         usauNumber,
//         phoneNumber,
//         wouldSponsor,
//         willAttendFinals
//       }
//
//       if (Array.isArray(preferredPositions)) {
//         newPlayerRecord.preferredPositions = preferredPositions
//       } else if (typeof preferredPositions === 'string') {
//         newPlayerRecord.preferredPositions = [preferredPositions]
//       } else {
//         newPlayerRecord.preferredPositions = []
//       }
//
//       console.log(newPlayerRecord)
//
//       const player = new PlayerModel(newPlayerRecord)
//
//       await player.save()
//
//       try {
//         const emailSendParams = {
//           from: 'South Florida Ultimate" <sflultimate@gmail.com>',
//           to: email,
//           subject: 'Registration Confirmation for ' + locals.league.title,
//           html: `
//             <p>Thank you for your payment!</p>
//             <p>Below you can find a receipt for your registration for ${locals.league.title}.</p>
//             <table style="border: 1px solid #dadada; padding: 4px;">
//               <thead>
//                 <tr>
//                   <th>Field</th>
//                   <th>Your Submission</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr><td>First Name</td><td>${firstName}</td></tr>
//                 <tr><td>Last Name</td><td>${lastName}</td></tr>
//                 <tr><td>Registration Level</td><td>${registrationLevel}</td></tr>
//                 <tr><td>Amount Paid</td><td>$${amount}</td></tr>
//                 <tr><td>Gender</td><td>${gender}</td></tr>
//                 <tr><td>Participation</td><td>${participation}</td></tr>
//                 <tr><td>Comments</td><td>${comments}</td></tr>
//                 <tr><td>Email</td><td>${email}</td></tr>
//                 <tr><td>Phone Number</td><td>${phoneNumber}</td></tr>
//                 <tr><td>Age</td><td>${age}</td></tr>
//                 <tr><td>Wanted to Captain</td><td>${wouldCaptain ? 'Yes' : 'No'}</td></tr>
//                 <tr><td>Partner's Name</td><td>${partnerName}</td></tr>
//                 <tr><td>Self-described skill level</td><td>${skillLevel}</td></tr>
//                 <tr><td>Shirt Size</td><td>${shirtSize}</td></tr>
//               </tbody>
//             </table>
//             <p><em>Organized by South Florida Ultimate Inc., a local non-for-profit and social recreational club organized for the exclusive purposes of <strong>playing</strong>, <strong>promoting</strong>, and <strong>enjoying</strong> the sport known as Ultimate or Ultimate Frisbee.</em></p>
//           `
//         }
//
//         await transporter.sendMail(emailSendParams)
//       } catch (e) {
//         console.error('Could not send email for ' + email)
//         console.error(e)
//       }
//
//       res.redirect('/confirmation')

//
// (function ($) {
//   document.querySelector('#submitButton').addEventListener('click', function (e) {
//     const hasAtLeastOnePlayerPositionChecked = Array.from(document.querySelectorAll('input[name="preferredPositions"]')).find(function (item) {
//       return item.checked
//     })
//     if (!hasAtLeastOnePlayerPositionChecked) {
//       e.preventDefault()
//       e.stopPropagation()
//       const $playerPositionDivs = document.getElementById('playerPositions').offsetTop
//       window.scrollTo({ top: $playerPositionDivs, behavior: 'smooth' })
//       document.getElementById('playerPositionError').style.display = 'block'
//       return false
//     }
//     return true
//   }, {
//     capture: true
//   })
//   braintree.setup(clientToken, 'dropin', {
//     container: 'payment-form'
//   })
//
//   window.grecaptcha.ready(function () {
//     window.grecaptcha.execute('6Ld6rNQUAAAAAAthlbLL1eCF9NGKfP8-mQOHu89w', { action: 'register' }).then(function (token) {
//       $('#recaptcha').val(token)
//     })
//   })
// })(window.jQuery)
