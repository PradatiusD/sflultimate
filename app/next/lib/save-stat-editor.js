const { gql } = require('@apollo/client')

const UPDATE_GAME = gql`
  mutation UpdateStatEditorGame($id: ID!, $data: GameUpdateInput) {
    updateGame(id: $id, data: $data) {
      id
      homeTeamScore
      awayTeamScore
    }
  }
`

const UPDATE_STAT = gql`
  mutation UpdateStatEditorStat($id: ID!, $data: PlayerGameStatUpdateInput) {
    updatePlayerGameStat(id: $id, data: $data) {
      id
      assists
      scores
      defenses
      attended
      player { id }
    }
  }
`

const CREATE_STAT = gql`
  mutation CreateStatEditorStat($data: PlayerGameStatCreateInput) {
    createPlayerGameStat(data: $data) {
      id
      assists
      scores
      defenses
      attended
      player { id }
    }
  }
`

async function saveStatEditor ({ gameId, gameData, stats }, client) {
  const graphqlClient = client || require('./server-graphql-client')

  await graphqlClient.mutate({
    mutation: UPDATE_GAME,
    variables: { id: gameId, data: gameData }
  })

  const responses = await Promise.all(stats.map(stat => {
    const data = {
      player: { connect: { id: stat.playerId } },
      game: { connect: { id: gameId } },
      assists: stat.assists,
      scores: stat.scores,
      defenses: stat.defenses,
      attended: stat.attended
    }

    return graphqlClient.mutate(stat.gameStatId
      ? { mutation: UPDATE_STAT, variables: { id: stat.gameStatId, data } }
      : { mutation: CREATE_STAT, variables: { data } })
  }))

  return responses.map(response => response.data.updatePlayerGameStat || response.data.createPlayerGameStat)
}

module.exports = { saveStatEditor }
