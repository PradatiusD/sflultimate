'use client'
import { HeaderNavigation } from '../components/Navigation'
import dynamic from 'next/dynamic'
import SeoHead from '../components/SeoHead'
const ClientOnlyComponent = dynamic(() => import('../components/Quiz'), {
  ssr: false
})

export default function QuizPage () {
  return (
    <>
      <SeoHead
        title="SFLUltimate Quiz"
        description="Interactive SFLUltimate quiz experience."
        path="/quiz"
        noindex
        image={false}
      />
      <HeaderNavigation />
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <ClientOnlyComponent />
          </div>
        </div>
      </div>
    </>
  )
}
