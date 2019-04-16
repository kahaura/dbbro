const sql = require('mssql')

const GLOBAL_RECORDS_FETCH_LIMIT = 100

class SQLServerManager {
    constructor(config) {
        this.config = config;
        this.pool = null;

        //this.connect = this.connect.bind(this)
    }
    
    connect() {
        return new Promise((solve, reject) => {
            const poolCreator = new sql.ConnectionPool(this.config)
            poolCreator.connect().then(pool => {
                this.pool = pool
                solve()
            }).catch(error => reject(error))
        })
    }

    async getDatabases(ignoreFetchTables) {
        const sql = this.pool.request()
        const statement = "SELECT name FROM master.dbo.sysdatabases"
        const databases = await sql.query(statement)
        const results = []
        for(var row of databases.recordset) {
            const name = row.name
            const result = {
                name: name,
                system: ['master', 'tempdb', 'model', 'msdb'].indexOf(name.toLowerCase()) >= 0
            }
            if(!ignoreFetchTables) {
                const tables = await sql.query(`select TABLE_NAME as tableName from ${name}.INFORMATION_SCHEMA.TABLES where TABLE_TYPE like 'BASE TABLE'`)
                result.tables = tables.recordset.map(t => t.tableName)
            }
            results.push(result)
        }
        return results    
    }

    async getTables(database) {
        const sql = this.pool.request()
        const statement = `select TABLE_NAME as tableName from ${database}.INFORMATION_SCHEMA.TABLES where TABLE_TYPE like 'BASE TABLE'`
        const tables = await sql.query(statement)
        const names = tables.recordset.map((e) => e.tableName)
        const tasks = names.map(async (tableName) => await this.getTableInformation(database, tableName))
        const results = await Promise.all(tasks)
        return results    
    }

    async getPrimaryKey(database, table) {
        const statement = `SELECT COLUMN_NAME as name FROM ${database}.INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE OBJECTPROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA + '.' + QUOTENAME(CONSTRAINT_NAME)), 'IsPrimaryKey') = 1 AND TABLE_NAME='${table}'`;
        const results = await this.pool.request().query(statement);
        return results.recordset.map(e => e.name);    
    }

    async getTableInformation(database, table) {
        const statement = 
            `select COLUMN_NAME as name, 
                IS_NULLABLE as isNullable, 
                DATA_TYPE as dataType, 
                CHARACTER_MAXIMUM_LENGTH as strLength, NUMERIC_PRECISION as numLength 
                from ${database}.INFORMATION_SCHEMA.COLUMNS where TABLE_NAME='${table}' order by ORDINAL_POSITION`;
        const sql = this.pool.request()
        const results = await sql.query(statement);
        const columns = results.recordset;
        const pks = await this.getPrimaryKey(database, table);
        columns.forEach(c => {
            c.isPrimary = pks.includes(c.name);
            c.isNullable = c.isNullable == 'YES';
        });
        const info = {
            database,
            name: table, 
            columns
        };
        console.dir(`Table [${database}:${table}] fetched: ${info}`);
        return info;
    }

    formatValue(dataType, value) {
        if(value == null) {
            return null
        }
        if(dataType == 'BIT') {
            return value ? 1 : 0;
        }
        const converted = ['VARCHAR', 'NVARCHAR', 'CHAR', 'NCHAR'].indexOf(dataType) >= 0 ? "'" + value + "'": value
        console.debug(value, ' of ', dataType, 'changed to ', converted)
        return converted
    }

    async updateTableRecords(database, table, updates) {
        const info = await this.getTableInformation(database, table)
        const dataTypes = {}
        info.columns.forEach(c => dataTypes[c.name] = c.dataType.toUpperCase())
        const toSQL = (column, value) => this.formatValue(dataTypes[column], value)
        const getProperOperation = (column, value) => value != null ? '=' : 'is'
        if(updates.length > 0) {
            const sql = this.pool.request();
            const tasks = updates.map(async r => {
                const where = Object.keys(r.origin).map(key => `${key} ${getProperOperation(key, r.origin[key])} ${toSQL(key, r.origin[key])}`).join(' AND ')
                const set = Object.keys(r.head).map(key => `${key} = ${toSQL(key, r.head[key])}`).join(', ')
                const statement = `UPDATE ${database}.dbo.${table} SET ${set} WHERE ${where}`
                console.debug(statement)
                await sql.query(statement)
            })
            await  Promise.all(tasks);
        }
        return updates.length
    }

    async insertNewRecords(database, table, inserts) {
        const info = await this.getTableInformation(database, table)
        const dataTypes = {}
        info.columns.forEach(c => dataTypes[c.name] = c.dataType.toUpperCase())
        console.dir(dataTypes)
        const toSQL = (column, value) => this.formatValue(dataTypes[column], value)
        if(inserts.length > 0) {
            const sql = this.pool.request();
            const tasks = inserts.map(async r => {
                const fields = info.columns.map(c => c.name).join(', ')
                const values = info.columns.map(c => toSQL(c.name, r.head[c.name])).join(', ')
                const statement = `INSERT INTO ${database}.dbo.${table} (${fields}) VALUES(${values})`
                console.debug(statement)
                await sql.query(statement)
            })
            await Promise.all(tasks);
        }
        return inserts.length
    }

    async deleteTableRecords(database, table, deletes) {
        const info = await this.getTableInformation(database, table)
        const dataTypes = {}
        info.columns.forEach(c => dataTypes[c.name] = c.dataType.toUpperCase())
        const toSQL = (column, value) => this.formatValue(dataTypes[column], value)
        if(deletes.length > 0) {
            const sql = this.pool.request();
            const tasks = deletes.map(async r => {
                const where = Object.keys(r.origin).map(key => `${key} = ${toSQL(key, r.origin[key])}`).join(' AND ')
                const statement = `DELETE FROM ${database}.dbo.${table} WHERE ${where}`
                console.debug(statement)
                await sql.query(statement)
            })
            await  Promise.all(tasks);
        }
        return deletes.length
    }

    async syncTable(database, table, records) {
        const updates = records.filter(r => r.updated)
        const inserts = records.filter(r => r.inserted)
        const deletes = records.filter(r => r.deleted)
        const updated = await this.updateTableRecords(database, table, updates)
        const inserted = await this.insertNewRecords(database, table, inserts)
        const deleted = await this.deleteTableRecords(database, table, deletes)
        return {updated, inserted, deleted}
    }

    async getData(database, table, criteria) {
        const sql = this.pool.request()
        const select = `select top ${GLOBAL_RECORDS_FETCH_LIMIT} * from ${database}.dbo.${table}`
        const statement = criteria ? `${select} where ${criteria}` : select
        const results = await sql.query(statement)
        return results.recordset
    }

    async getCount(database, table) {
        const sql = this.pool.request()
        const statement = `select count(*) as count from ${database}.dbo.${table}`
        const results = await sql.query(statement)
        return results.recordset[0].count
    }
}

module.exports = SQLServerManager