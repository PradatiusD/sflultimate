const { BlockList, isIP } = require('net')

const blockedIPs = new BlockList()
blockedIPs.addSubnet('18.97.9.96', 29, 'ipv4')

module.exports = function configureExpress (app) {
  // Direct-to-Heroku deployment: trust only the router's rightmost XFF entry.
  // Revisit this if a CDN or another proxy is added in front of Heroku.
  app.set('trust proxy', 1)

  app.use((req, res, next) => {
    const ip = req.ip
    const family = isIP(ip)
    if (family && blockedIPs.check(ip, family === 6 ? 'ipv6' : 'ipv4')) {
      return res.status(403).type('text/plain').send('Forbidden')
    }
    next()
  })
}
