require('./polyfill')
require('./security')
require('./server')
require('./database')
require('./schema')
require('./table')
const {app} = require('./service')
const {settings} = require('./config')

app.use(function (req, res, next) {
  console.debug(req.url)
  try {
    next()
  } catch(e) {
    console.error('####################')
    console.error(e)
  }
})

app.listen(settings.port, () => {
  console.log(`Listening on port ${settings.port}!`)
})
