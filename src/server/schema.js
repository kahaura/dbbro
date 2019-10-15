const express = require("express");

const { app, ok, fail } = require("./service");
const { getDatabaseEngine } = require("./server");
const { logger } = require("./logging");

const router = express.Router();

router.get("/find", async (req, res) => {
  try {
    const { server, database } = req.query;
    const engine = await getDatabaseEngine(server);
    const schemas = await engine.getSchemas(database);
    res.send(ok(schemas));
  } catch (exception) {
    logger.error(exception);
    res.status(500).send(fail({ exception }));
  }
});

router.post("/create", async (req, res) => {
  try {
    const { server, database, name } = req.body;
    logger.debug(
      `Creating scheme[${name}] in database [${database}] of server [${server}]`
    );
    const engine = await getDatabaseEngine(server);
    await engine.createSchema(database, name);
    res.send(ok(name));
  } catch (exception) {
    console.error(exception);
    logger.error(exception);
    res.status(500).send(fail({ exception }));
  }
});

router.post("/drop", async (req, res) => {
  try {
    const { server, database, name } = req.body;
    const engine = await getDatabaseEngine(server);
    await engine.dropSchema(database, name);
    res.send(ok(name));
  } catch (exception) {
    logger.error(exception);
    res.status(500).send(fail({ exception }));
  }
});

app.use("/api/v1/schema", router);
