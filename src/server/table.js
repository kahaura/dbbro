const express = require('express')

const { app, ok, fail } = require('./service')
const { getDatabaseEngine } = require('./server')

const router = express.Router();

router.get('/find', async (req, res) => {
  try {
    const { server, database, schema } = req.query;
    const engine = await getDatabaseEngine(server)
    const tables = await engine.getTables(database, schema);
    res.send(ok(tables));
  } catch (exception) {
    res.status(500).send(fail({exception}))
  }
});

router.get('/sql/count', async (req, res) => {
  try {
    const { server, database, schema, table } = req.query;
    const engine = await getDatabaseEngine(server)
    const count = await engine.getCount(database, schema, table);
    res.send(ok({ count }));
  } catch (exception) {
    res.status(500).send(fail({exception}))
  }
});

router.get('/sql/browse', async (req, res) => {
  try {
    const { server, database, schema, table, criteria } = req.query;
    const engine = await getDatabaseEngine(server)
    const info = await engine.getTableInformation(database, schema, table);
    const rows = await engine.getData(database, schema, table, criteria);
    res.send(ok({ info, rows }));
  } catch (exception) {
    res.status(500).send(fail({exception}))
  }
});

router.post('/sql/sync', async (req, res) => {
  try {
    const { body } = req;
    const { server, database, schema, table, records } = body;
    const engine = await getDatabaseEngine(server)
    const updated = await engine.syncTable(database, schema, table, records);
    res.send(ok({ updated }));
  } catch (exception) {
    res.status(500).send(fail({exception}))
  }
});

app.use('/api/v1/table', router);