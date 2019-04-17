const express = require('express');
const bodyParser = require('body-parser');
const SQLServerManager = require('./mssql');

const app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-
app.use(express.static('dist'));

const engine = new SQLServerManager({})

app.get('/api/v1/databases', async (req, res) => {
    const ignoreFetchTables = req.params.ignoreFetchTables
    const databases = await engine.getDatabases(ignoreFetchTables)
    res.send(databases)
});


app.get('/api/v1/:database/tables', async (req, res) => {
    const database = req.params.database
    const results = await engine.getTables(database)
    res.send(results);
});

app.get('/api/v1/:database/ddl/:table', async (req, res) => {
    const table = req.params.table
    const database = req.params.database
    const info = await engine.getTableInformation(database, table)
    res.send(info);
});

app.get('/api/v1/:database/sql/:table', async (req, res) => {
    const table = req.params.table
    const database = req.params.database
    const criteria = req.params.criteria
    const info = await engine.getTableInformation(database, table)
    const rows = await engine.getData(database, table, criteria)
    res.send({info, rows});
});

app.post('/api/v1/:database/sql/:table/sync', async (req, res) => {
    try {
        const table = req.params.table
        const database = req.params.database
        const body = req.body;
        const updated = await engine.syncTable(database, table, body.records)
        res.send({updated});
    } catch(e) {
        console.error(e)
    }
});

app.get('/api/v1/:database/sql/:table/count', async (req, res) => {
    const table = req.params.table
    const database = req.params.database
    const count = await engine.getCount(database, table)
    res.send({count})
});

engine.connect().then(() => {
    console.log('Connection to database is OK.')
    app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`))
}).catch(error => {
    console.error(error);
    process.exit(-1);
})
