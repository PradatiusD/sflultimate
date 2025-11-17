'use client'
import { HeaderNavigation } from '../components/Navigation'
import dynamic from 'next/dynamic'
const ClientOnlyComponent = dynamic(() => import('../components/Quiz'), {
  ssr: false
})

export default function QuizPage () {
  return (
    <>
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
