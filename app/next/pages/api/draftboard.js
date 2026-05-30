export default async function handler (req, res) {
  res.status(501).json({
    error: 'Draftboard API has not been migrated to Keystone 6 yet.'
  })
}
