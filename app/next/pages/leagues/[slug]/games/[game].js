import { getGamePageProps } from '../../../../lib/game-utils'
import GamePage from '../../../../components/GamePage'

export const getServerSideProps = async (context) => {
  return getGamePageProps(context)
}

export default GamePage
