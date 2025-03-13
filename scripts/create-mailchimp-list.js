require('dotenv').config()
const Mailchimp = require('mailchimp-api-v3')
const MongoClient = require('mongodb').MongoClient

/*
 * node scripts/create-mailchimp-list.js
 */

const url = 'mongodb://localhost:27017/sflultimateV5'
const API_KEY = process.env.MAILCHIMP_KEY
const LIST_ID = '2fb82216db'
const listMemberEndpoint = `/lists/${LIST_ID}/members`
const mc = new Mailchimp(API_KEY)

MongoClient.connect(url, { useUnifiedTopology: true }, async function (err, client) {
  if (err) {
    throw err
  }

  const db = client.db('sflultimateV5')

  async function getRecords (collection) {
    const records = await db.collection(collection).find().toArray()
    return records.map(function (record) {
      record.collection = collection
      return record
    })
  }

  const players = await getRecords('players')
  const hatterPlayers = await getRecords('hatterplayers')
  const leagues = await getRecords('leagues')
  const leagueMap = new Map()
  for (const league of leagues) {
    leagueMap.set(league._id.toString(), league)
  }
  const recordsToReview = players.concat(hatterPlayers)

  console.log('Fetching Mailchimp list')
  const list = await mc.get({
    path: listMemberEndpoint,
    query: {
      count: 2000
    }
  })
  console.log('Retrieved Mailchimp list')

  const emailMap = new Map()
  for (const member of list.members) {
    emailMap.set(member.email_address, member)
  }

  // https://mailchimp.com/developer/marketing/api/list-members/
  for (const player of recordsToReview) {
    try {
      const hasEmail = emailMap.has(player.email)
      if (hasEmail) {
        console.log(player.email + ' already exists')
        await addTagsToPlayer({
          player: player,
          record: emailMap.get(player.email),
          leagues: leagues,
          leagueMap: leagueMap
        })
      } else {
        console.log(player.email + ' is being added')
        const response = await mc.post(listMemberEndpoint, {
          email_address: player.email,
          status: 'subscribed'
        })
        console.log(response)
      }
    } catch (e) {
      console.log(e.message)
    }
  }
  console.log(list)
  db.close()
})

async function addTagsToPlayer (options) {
  const { player, record, leagues, leagueMap } = options
  const missingNameInformation = !record.merge_fields.FNAME || !record.merge_fields.LNAME
  if (missingNameInformation) {
    const memberEndpoint = listMemberEndpoint + '/' + record.id
    const response = await mc.put(memberEndpoint, {
      merge_fields: {
        FNAME: player.firstName,
        LNAME: player.lastName
      }
    })
    console.log(response)
  }

  const collection = player.collection
  const tags = []
  if (collection === 'players') {
    if (player.leagues) {
      for (const league of leagues) {
        tags.push(leagueMap.get(league._id.toString()).title)
      }
      tags.push('Any League Player')
    }
  } else if (collection === 'hatterplayers') {
    tags.push('Hatter Player')
  }
  if (tags.length > 0) {
    await mc.post(`${listMemberEndpoint}/${record.id}/tags`, {
      tags: tags.map((tagName) => {
        return {
          name: tagName,
          status: 'active'
        }
      })
    })
  }
}
