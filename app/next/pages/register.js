// extends ../layouts/default
//
// block head
//     meta(property="og:title" content="Register now for the SFL Ultimate " + locals.league.title)
//     meta(property="og:url" content="https://www.sflultimate.com/register")
//     meta(property="og:description" content=locals.league.summary || '')
//     if locals.league.registrationShareImage && locals.league.registrationShareImage.url 
//         meta(property="og:image" content=locals.league.registrationShareImage.url)
//     script(src="https://www.google.com/recaptcha/api.js?render=6Ld6rNQUAAAAAAthlbLL1eCF9NGKfP8-mQOHu89w")
// block content
//    
//     if locals.league.canRegister
//
//         .container.register: .row: .col-md-12
//    
//             if err
//                 br
//                 .alert.alert-danger
//                     strong Error: 
//                     span=err
//             br
//             br
//             h1=league.title + " Sign Up" 
//
//             if locals.league.description 
//                 !{locals.league.description}
//
//             p 
//             | Regular registration is open <strong>as of #{locals.formatDate(locals.league.registrationStart)} 
//             | and ends #{locals.formatDate(locals.league.registrationEnd)}</strong>.
//            
//             br
//            
//             if locals.league.lateRegistrationStart && locals.league.lateRegistrationEnd
//               .alert.alert-info 
//                | Late registration (at a $#{locals.fees.lateAdult} fee for adults, $#{locals.fees.lateStudent} for students, as space permits) starts
//                | #{formatDate(locals.league.lateRegistrationStart)} until #{formatDate(locals.league.lateRegistrationEnd)} at #{formatTime(locals.league.lateRegistrationEnd)}. This will not include a jersey.
//                
//             hr
//             h3 Registration
//             form#registration(method="post" autocomplete="off")
//                 .row
//                     .col-md-6
//                         .form-group
//                             label(for='firstName') First Name
//                             input#firstName.input-lg.form-control(type='text' name='firstName' placeholder='' required)
//                     .col-md-6
//                         .form-group
//                             label(for='lastName') Last Name
//                             input#lastName.input-lg.form-control(type='text' name='lastName' placeholder='' required)
//    
//                 .form-group
//                     label(for='email') Email Address
//                     input#email.input-lg.form-control(type='email' name='email' placeholder='' required)
//                     p.help-block We use your e-mail to send you updates and league information through the email you provide here.
//
//                 .form-group
//                     label(for='phoneNumber') Phone Number
//                     input#phoneNumber.input-lg.form-control(type='tel' name='phoneNumber' placeholder='')
//                     p.help-block Not required, but often our captains find reaching out via SMS/GroupMe/WhatsApp is much better than email.  Your number would be shared with your team.                   
//
//                 .form-group
//                     label(for="gender") Gender
//                     select#gender.input-lg.form-control(name="gender")
//                         option(value='Female') Female
//                         option(value='Male') Male
//                         option(value='Other') Other / I'd Prefer Not To
//                     p.help-block We use this information to draft teams that have even gender distributions.
//    
//                 .form-group
//                     label(for="age") Age (In Years)
//                     input#age.input-lg.form-control(type='number' name='age' required)
//                     p.help-block Our insurance policy requires us to report how many people within certain age-ranges exist in the league.  We do not ask your birthdate to protect your privacy.
//                    
//                 .form-group
//                     label(for="skillLevel") Skill Level
//                         select#skillLevel.input-lg.form-control(name="skillLevel")
//                             option(value='1') 1 - Absolute Beginner - never played before
//                             option(value='2') 2 - Hey wait, what's a flick?
//                             option(value='3') 3 - Working on throws, basic knowledge of the game
//                             option(value='4') 4 - Pick-up player, okay throws
//                             option(value='5') 5 - Decent backhand & forehand. Little to no club experience
//                             option(value='6') 6 - Fairly solid backhand & forehand. Some club experience
//                             option(value='7') 7 - Tourney experience. Several years of club
//                             option(value='8') 8 - Club level, solid all around, not prone to errors
//                             option(value='9') 9 - Rock star. spot on throws, awesome D
//                     p.help-block Consider throwing accuracy, defensive abilities, agility and game awareness when choosing a skill level. <strong>Please choose HONESTLY</strong> as this helps captains to accurately draft a balanced team.
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
//                 .form-group
//                     label(for='partnerName') Partner Name
//                     input#partnerName.input-lg.form-control(type='text' name='partnerName' placeholder='')
//                     p.help-block Type the name of the person you would like to partner with.  The captains during the draft will make every effort to accommodate this request, but we can't guarantee this.
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
//                 .form-group
//                     label(for="registrationLevel") Registration Level
//                         select#registrationLevel.input-lg.form-control(name="registrationLevel")
//                             if locals.league.isEarlyRegistrationPeriod
//                                 option(value='Adult')="Adult - $" + fees.earlyAdult
//                                 option(value='Student')="Student - $" + fees.earlyStudent
//                             else if locals.league.isRegistrationPeriod
//                                 option(value='Adult')="Adult - $" + fees.regularAdult
//                                 option(value='Student')="Student - $" + fees.regularStudent
//                             else if locals.league.isLateRegistrationPeriod
//                                 option(value='Adult')="Adult - $" + fees.lateAdult
//                                 option(value='Student')="Student - $" + fees.lateStudent
//                
//                 .form-group
//                     label(for="streetAddress") Street Address
//                     input#streetAddress.input-lg.form-control(type='text' name='streetAddress' placeholder='' required)
//                     p.help-block If you plan on paying with card (so no PayPal) type here just your street address (So 12345 Palm Tree Ave.). Do not pass city/zip code or apt number. We do not store this information, but send it to the payment processor for fraud prevention.
//                
//                 #payment-form
//                 .text-center
//                     button.btn.btn-default.btn-lg.btn-primary(type='submit' id='submitButton') Submit
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
//     script(src="https://js.braintreegateway.com/js/braintree-2.32.1.min.js")
//     script.
//         var clientToken = "#{braintree_token}";
//     script(src='js/register-form.js')

// const keystone = require('keystone')
// const PlayerModel = keystone.list('Player').model
// const PaymentUtils = require('../utils')
// const uuid = require('uuid')
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
//   const view = new keystone.View(req, res)
//   const locals = res.locals
//
//   locals.formatDate = function (date) {
//     return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/New_York' })
//   }
//
//   locals.formatTime = function (date) {
//     return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })
//   }
//
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
//
//     const purchase = {
//       amount: amount,
//       paymentMethodNonce,
//       options: {
//         submitForSettlement: true
//       },
//       customer: {
//         firstName,
//         lastName,
//         email
//       },
//       billing: {
//         streetAddress
//       },
//       customFields: {
//         partner: partnerName,
//         gender: gender,
//         skillLevel,
//         participation
//       }
//     }
//
//     try {
//       const result = await PaymentUtils.createSale(purchase)
//       if (!result.success) {
//         console.log(JSON.stringify(result, null, 2))
//         if (result.message) {
//           locals.err = 'We\'re sorry, the payment processor rejected this transaction for the following reason: ' + result.message
//         } else {
//           locals.err = JSON.stringify(result, null, 2)
//         }
//         return next()
//       }
//       const newPlayerRecord = {
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         age,
//         name: {
//           first: firstName,
//           last: lastName
//         },
//         email,
//         partners: partnerName,
//         password: uuid.v4(),
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
//         console.error('Cound not send email for ' + email)
//         console.error(e)
//       }
//
//       res.redirect('/confirmation')
//     } catch (err) {
//       locals.err = err
//       console.log(err)
//       return next()
//     }
//   })
//
//   // Render the view
//   view.render('register')
// }


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
