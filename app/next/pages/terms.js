import Head from 'next/head'
import { HeaderNavigation } from '../components/Navigation'
import {updateWithGlobalServerSideProps} from "../lib/global-server-side-props";

export const getServerSideProps = async () => {
  const props = {}
  await updateWithGlobalServerSideProps(props)
  return {
    props
  }
}

export default function TermsPage (props) {
  const {leagues} = props
  return (
    <div>
      <Head>
        <meta property="og:title" content="South Florida Ultimate Inc. Terms & Conditions" />
        <meta property="og:url" content="https://www.sflultimate.com/terms" />
        <meta property="og:image" content="https://www.sflultimate.com/images/open-graph/homepage.jpg" />
        <meta property="og:description" content="Here you can find our terms as they relate to participating in SFUltimate events" />
      </Head>
      <HeaderNavigation leagues={leagues} />
      <div className="container">
        <div className="row">
          <div className="col-sm-8 col-sm-offset-2">
            <h1>Terms & Conditions</h1>
            <p> South Florida Ultimate Inc. is a 501(c)3 non-profit run by a volunteer board, below referred to as SFLUltimate.  As part of participating in any events, you agree to the following</p>
            <p> 1. In consideration for receiving permission to participate in SFLUltimate events I hereby <strong>release, waive, discharge, and convent not to sue</strong>, their officers, agents, or employees (hereinafter referred to as <strong>releasees</strong>) from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury, including death, that may be sustained by me, or to any property belonging to me, while participating in such activity, while in, on or upon the premises where the activities are being conducted, <strong>regardless of whether such loss is caused by the negligence of the releasees</strong>, or otherwise and regardless of whether such liability arises in tort, contract, strict liability, or otherwise, to the fullest extent allowed by law.</p>
            <p> 2. By participating in any event organized by SFLUltimate, I agree to allow my name, photograph, audio, or video footage to be used for marketing and informational purposes, and my contact information to be shared for purposes of fulfilling events and league, team, and player-specific communications. I understand that SFLUltimate uses such content mainly to help grow the organization's operations, reach & impact as it relates to its mission of growing the sport of Ultimate Frisbee. I also understand that if I would like any content featuring my likeness to be removed or to no longer be contacted, I may contact SFLUltimate, and they will make their best effort to comply with my request.</p>
            <p> 3. I am fully aware of the risks and hazards connected with the activities of Ultimate, and I am aware that such activities include the risk of injury and even death, and I hereby elect to voluntarily participate in said activities, knowing that the activities may be hazardous to my property and me. I understand that SFLUltimate does not require me to participate in this activity. I voluntarily assume full responsibility for any risks of loss, property damage, or personal injury, including death, that may be sustained by me, or any loss or damage to property owned by me, as a result of being engaged in such an activities, <strong>whether caused by the negligence of releasees</strong> or otherwise, to the fullest extent allowed by law.</p>
            <p> 4. I further hereby <strong>agree to indemnify and hold harmless the releasees</strong> from any loss, liability, damage, or costs, including court costs and attorneys' fees that Releases may incur due to my participation in said activities, <strong>whether caused by the negligence of releasees</strong> or otherwise, to the fullest extent allowed by law.</p>
            <p> 5. It is my express intent that this Waiver and Hold Harmless Agreement shall bind the members of my family and spouse, if I am alive, and my heirs, assigns and personal representative, if I am deceased, and shall be deemed as a <strong>release, waiver, discharge, and covenant not to sue</strong> the above-named RELEASEES. I hereby further agree that this Waiver of Liability and Hold Harmless Agreement shall be construed in accordance with the laws of the State of Florida and that any mediation, suit, or other proceeding must be filed or entered into only in Florid and the federal or state courts of Maryland. Any portion of this document deemed unlawful or unenforceable is severable and shall be stricken without any effect on the enforceability of the remaining provisions.</p>
            <p> <strong>In completing this registration and participating in league, I acknowledge and represent that</strong> I have read the foregoing Wavier of Liability and Hold Harmless Agreement, understand it and sign it voluntarily as my own free act and deed; no oral representations, statements, or inducements, apart from the foregoing written agreement, have been made; I am at least eighteen (18) years of age and fully competent; and I execute this Agreement for full, adequate and complete consideration fully intending to be bound by same.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
