import { saveStatEditor } from '../../lib/save-stat-editor'

export default async function handler (req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  const { gameId, gameData, stats } = req.body || {}
  if (!gameId || !gameData || !Array.isArray(stats)) {
    res.status(400).json({ error: 'Invalid stat editor payload.' })
    return
  }

  try {
    const savedStats = await saveStatEditor({ gameId, gameData, stats })
    res.status(200).json({ stats: savedStats })
  } catch (error) {
    console.error('Unable to save game stats:', error)
    res.status(500).json({ error: 'Unable to save game stats.' })
  }
}
