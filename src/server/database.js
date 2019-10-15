const express = require('express')

const { app, ok, fail } = require('./service')
const { getDatabaseEngine } = require('./server')
const { logger } = require('./logging')

const router = express.Router();

router.get('/find', async (req, res) => {
  try {
    const { server } = req.query;
    const engine = await getDatabaseEngine(server)
    const databases = await engine.getDatabases();
    console.dir(databases)
    res.send(ok(databases));
  } catch (exception) {
    logger.error(exception)
    res.status(500).send(fail({exception}))
  }
});

router.post('/create', async (req, res) => {
  try {
    const { server, name } = req.body;
    const engine = await getDatabaseEngine(server)
    await engine.createDatabase(name);
    res.send(ok(name));
  } catch (e) {
    console.error(e);
  }
});

router.post('/drop', async (req, res) => {
  try {
    const { server, name } = req.body;
    const engine = await getDatabaseEngine(server)
    await engine.dropDatabase(name);
    res.send(ok(name));
  } catch (e) {
    console.error(e);
  }
});

router.post('/execute', async (req, res) => {
  try {
    const { server, database, query } = req.body;
    const engine = await getDatabaseEngine(server)
    const result = await engine.exec(query, database);
    res.send(ok(result));
  } catch (e) {
    console.error(e);
    res.status(500).send(fail(e))
  }
});

app.use('/api/v1/database', router);