const requireAuth = ({ authentication }) => Boolean(authentication && authentication.item)
const access = process.env.NODE_ENV === 'development' ? true : requireAuth

module.exports = {
  defaultAccess: {
    list: access,
    field: access,
    custom: access
  }
}
