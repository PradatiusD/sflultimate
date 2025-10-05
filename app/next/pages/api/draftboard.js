import keystone from '../../../keystone'
import mongodb, { ObjectId } from 'mongodb'

export default async function handler (req, res) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Not authorized'
    })
  }
  const client = await mongodb.connect(keystone.adapter.config.mongoUri)
  const db = client.db('sflultimateV5')
  const teamId = new ObjectId(req.body.teamId)
  const playerId = new ObjectId(req.body.playerId)
  const action = req.body.action
  const TeamPlayerAssociations = await db.collection('team_players_manies')
  const assocMatchParams = {
    Team_left_id: teamId,
    Player_right_id: playerId
  }
  if (action === 'remove') {
    try {
      await TeamPlayerAssociations.deleteOne(assocMatchParams)
    } catch (err) {
      res.status(500).json({ error: err.message })
      console.error(err)
    }
  } else if (action === 'add') {
    try {
      await TeamPlayerAssociations.insertOne(assocMatchParams)
    } catch (err) {
      res.status(500).json({ error: err.message })
      console.error(err)
    }
  }
  const associations = await TeamPlayerAssociations.find({
    Team_left_id: teamId
  }).toArray()

  const associationMap = {}
  for (const association of associations) {
    const timestamp = association._id.getTimestamp()
    const idStr = association.Player_right_id.toString()
    associationMap[idStr] = timestamp
  }

  const teams = await db.collection('teams').find({
    _id: teamId
  }, {
    projection: {
      _id: 1,
      name: 1,
      color: 1
    }
  }).toArray()
  const team = teams[0]
  const players = await db.collection('players').find({
    _id: {
      $in: associations.map(a => a.Player_right_id)
    }
  }, {
    projection: {
      _id: 1,
      firstName: 1,
      lastName: 1,
      gender: 1,
      skillLevel: 1,
      athleticismLevel: 1,
      experienceLevel: 1,
      throwsLevel: 1
    }
  }).toArray()

  if (team) {
    team.players = players
    team.id = team._id

    team.players = team.players.map(player => {
      player.id = player._id
      return player
    })

    team.players.sort((a, b) => {
      const idA = associationMap[a._id.toString()].getTime()
      const idB = associationMap[b._id.toString()].getTime()
      return idA - idB
    })
  }

  const response = {
    data: {
      updateTeam: team
    }
  }

  // Let's return the data in the order it was created
  res.status(200).json(response)
}
