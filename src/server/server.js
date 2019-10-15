const express = require('express')

const {settings} = require('./config')
const {app, ok, fail} = require('./service')
const {logger} = require('./logging')

const engines = [
  require('./engines/mssql')
]

const instances = {}

async function create({type, name, config}) {
  logger.debug(`Creating server [${name}] with database engine [${type}]...`)
  const item = {type, name, config}
  if(!name || !type) {
    throw {message: `Name and database types are required.`}
  }
  if(!getSupportedDatabases().includes(type)) {
    throw {message: `Database type [${type}] is not supported.`}
  }
  if(settings.databases.find(e => e.name == name)) {
    throw {error: `Database with name [${name}] is already defined.`}
  }
  await testConnection(type, config)

  if(!config.port) {
    delete config.port
  }
  settings.databases.push(item)
  settings.save()
  return item
}

async function remove(name) {
  logger.debug(`Removing server [${name}]...`);
  if(!settings.databases.find(e => e.name == name)) {
    throw {message: `Server [${name}] does not exists.`}
  }
  const filtered = settings.databases.filter(e => e.name != name)
  settings.databases = filtered;
  settings.save()
}

function getSupportedDatabases() {
  return engines.map(e => e.type)
}

function getDatabaseEngineType(type) {
  const result = engines.find(e => e.type == type)
  if(result) {
    logger.debug(`Database engine for [${type}] found.`)
    return result
  }
  throw {message: `Database type [${type}] is not supported.`}
}

function getDatabaseConfig(name) {
  logger.debug(`Getting database config for [${name}]`)
  const item = settings.databases.find(e => e.name == name)
  if(!item) {
    const message = `Database [${name}] is not defined.`
    console.error(message)
    throw {message}
  }
  return item
}

async function testConnection(type, config) {
  logger.debug(`Going to test connection for [${type}] with configuration[${config}]...`)
  const {DatabaseEngine} = getDatabaseEngineType(type)
  logger.debug(`Database engine found:${DatabaseEngine}.`)
  const engine = new DatabaseEngine()
  await engine.testConnection(config)
}

async function getDatabaseEngine(name) {
  var engine = instances[name]
  
  if(!engine || !await engine.isHealthy()) {
    const {type, config} = getDatabaseConfig(name)
    const {DatabaseEngine} = getDatabaseEngineType(type)
    engine = new DatabaseEngine();
    await engine.connect(config)
    instances[name] = engine
    console.debug(`Engine [${type}] created for database [${name}].`)
  }

  if(!engine) {
    const message = `Could not create engine for database [${name}]`
    console.error(message)
    throw {message}
  }
  
  return engine
}

const router = express.Router();

router.get('/find', async (req, res) => {
  res.send(ok(settings.databases))
});

router.post('/create', async (req, res) => {
  try {
    const { type, name, config } = req.body
    await create({name, type, config}) 
    res.send(ok());
  } catch (exception) {
    res.status(500).send(fail({exception}))
  }
});

router.post('/remove', async (req, res) => {
  try {
    const { name } = req.body
    await remove(name) 
    res.send(ok());
  } catch (exception) {
    res.status(500).send(fail({exception}))
  }
});

app.use('/api/v1/server', router);

module.exports = {
  create,
  getSupportedDatabases,
  getDatabaseEngineType,
  getDatabaseEngine
}