const { Pool, Client } = require("pg");
const { settings } = require("../config");

const GLOBAL_RECORDS_FETCH_LIMIT = settings.globals.recordsFetchLimit;

class SQLServerEngine {
  constructor() {
    this.config = null;
    this.pools = [];
  }

  async destroy() {
    this.pools.forEach(async (pool) => {
      try {
        pool.end()
      } catch(e) {
        console.error(e) 
      }
    })
  }

  async connect(config) {
    this.config = config;
    await this.createPoolForDatabase(null);
  }

  async testConnection(config) {
    const client = new Client(config);
    await client.connect();
    await client.end();
  }

  async isHealthy() {
    try {
      if (this.pools) {
        const pool = await this.getDatabasePool(null)
        await pool.query("select NOW()");
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  }

  async createPoolForDatabase(name) {
    const config = {...this.config};
    config.database = name ? name : config.database;
    const pool = new Pool(config);
    await pool.query("SELECT NOW()");
    this.pools.push([name, pool])
  }

  async getDatabasePool(name) {
    var pool = this.pools.find(p => p.name == name)
    if(pool == null) {
      pool = await this.createPoolForDatabase(name);
    }
    return pool
  }

  async getSchemas(ignoreFetchTables) {
    const statement = "SELECT datname as name FROM pg_database WHERE datistemplate = false;";
    const pool = await this.getDatabasePool();
    const schemas = await pool.query(statement);
    const results = [];
    for (const row of schemas.rows) {
      const { name } = row;
      const result = {
        name,
        system:
          ["postgres"].indexOf(name.toLowerCase()) >= 0
      };
      if (!ignoreFetchTables) {
        const connectionPool = this.getDatabasePool(name)
        const tables = await connectionPool.query(
          `SELECT table_name as tableName FROM information_schema.tables WHERE table_schema='public'`
        );
        result.tables = tables.rows.map(t => t.tableName);
      }
      results.push(result);
    }
    return results;
  }

  async getTables(schema) {
    const pool = this.getDatabasePool(schema);
    SELECT * FROM information_schema.columns WHERE table_schema = 'your_schema' AND table_name   = 'your_table';
    const sql = this.pool.request();
    const statement = `select TABLE_NAME as tableName from ${schema}.INFORMATION_SCHEMA.TABLES where TABLE_TYPE like 'BASE TABLE'`;
    const tables = await sql.query(statement);
    const names = tables.recordset.map(e => e.tableName);
    const tasks = names.map(
      async tableName => await this.getTableInformation(schema, tableName)
    );
    const results = await Promise.all(tasks);
    return results;
  }

  async getPrimaryKey(schema, table) {
    const statement = `SELECT COLUMN_NAME as name FROM ${schema}.INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE OBJECTPROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA + '.' + QUOTENAME(CONSTRAINT_NAME)), 'IsPrimaryKey') = 1 AND TABLE_NAME='${table}'`;
    const results = await this.pool.request().query(statement);
    return results.recordset.map(e => e.name);
  }

  async getTableInformation(schema, table) {
    const statement = `select COLUMN_NAME as name, 
                IS_NULLABLE as isNullable, 
                DATA_TYPE as dataType, 
                CHARACTER_MAXIMUM_LENGTH as strLength, NUMERIC_PRECISION as numLength 
                from ${schema}.INFORMATION_SCHEMA.COLUMNS where TABLE_NAME='${table}' order by ORDINAL_POSITION`;
    const sql = this.pool.request();
    const results = await sql.query(statement);
    const pks = await this.getPrimaryKey(schema, table);
    const columns = results.recordset.map(c => ({
      ...c,
      isPrimary: pks.includes(c.name),
      isNullable: c.isNullable === "YES"
    }));
    const info = {
      schema,
      name: table,
      columns
    };
    console.dir(`Table [${schema}:${table}] fetched: ${info}`);
    return info;
  }

  static formatValue(dataType, value) {
    if (value == null) {
      return null;
    }
    if (dataType === "BIT") {
      return value ? 1 : 0;
    }
    const converted =
      ["VARCHAR", "NVARCHAR", "CHAR", "NCHAR"].indexOf(dataType) >= 0
        ? `'${value}'`
        : value;
    console.debug(value, " of ", dataType, "changed to ", converted);
    return converted;
  }

  async fetchDatatypeMap(schema, table) {
    const info = await this.getTableInformation(schema, table);
    const entries = info.columns.map(c => [c.name, c.dataType.toUpperCase()]);
    return Object.fromEntries(entries);
  }

  async updateTableRecords(schema, table, updates) {
    const dataTypes = await this.fetchDatatypeMap(schema, table);
    const toSQL = (column, value) =>
      SQLServerEngine.formatValue(dataTypes[column], value);
    const getProperOperation = (column, value) => (value != null ? "=" : "is");
    if (updates.length > 0) {
      const sql = this.pool.request();
      const tasks = updates.map(async r => {
        const where = Object.keys(r.origin)
          .map(
            key =>
              `${key} ${getProperOperation(key, r.origin[key])} ${toSQL(
                key,
                r.origin[key]
              )}`
          )
          .join(" AND ");
        const set = Object.keys(r.head)
          .map(key => `${key} = ${toSQL(key, r.head[key])}`)
          .join(", ");
        const statement = `UPDATE ${schema}.dbo.${table} SET ${set} WHERE ${where}`;
        console.debug(statement);
        await sql.query(statement);
      });
      await Promise.all(tasks);
    }
    return updates.length;
  }

  async insertNewRecords(schema, table, inserts) {
    const info = await this.getTableInformation(schema, table);
    const dataTypes = Object.fromEntries(
      info.columns.map(c => [c.name, c.dataType.toUpperCase()])
    );
    const toSQL = (column, value) =>
      SQLServerEngine.formatValue(dataTypes[column], value);
    if (inserts.length > 0) {
      const sql = this.pool.request();
      const tasks = inserts.map(async r => {
        const fields = info.columns.map(c => c.name).join(", ");
        const values = info.columns
          .map(c => toSQL(c.name, r.head[c.name]))
          .join(", ");
        const statement = `INSERT INTO ${schema}.dbo.${table} (${fields}) VALUES(${values})`;
        console.debug(statement);
        await sql.query(statement);
      });
      await Promise.all(tasks);
    }
    return inserts.length;
  }

  async deleteTableRecords(schema, table, deletes) {
    const dataTypes = await this.fetchDatatypeMap(schema, table);
    const toSQL = (column, value) =>
      SQLServerEngine.formatValue(dataTypes[column], value);
    if (deletes.length > 0) {
      const sql = this.pool.request();
      const tasks = deletes.map(async r => {
        const where = Object.keys(r.origin)
          .map(key => `${key} = ${toSQL(key, r.origin[key])}`)
          .join(" AND ");
        const statement = `DELETE FROM ${schema}.dbo.${table} WHERE ${where}`;
        console.debug(statement);
        await sql.query(statement);
      });
      await Promise.all(tasks);
    }
    return deletes.length;
  }

  async syncTable(schema, table, records) {
    const updates = records.filter(r => r.updated);
    const inserts = records.filter(r => r.inserted);
    const deletes = records.filter(r => r.deleted);
    const updated = await this.updateTableRecords(schema, table, updates);
    const inserted = await this.insertNewRecords(schema, table, inserts);
    const deleted = await this.deleteTableRecords(schema, table, deletes);
    return { updated, inserted, deleted };
  }

  static makeComparison(rule) {
    const strings = ["CHAR", "VARCHAR", "NVARCHAR", "NCHAR"];
    if (rule.comparison != null && rule.column != null && rule.value != null) {
      if (rule.value != null) {
        const value =
          strings.indexOf(rule.column.dataType.toUpperCase()) >= 0
            ? `'${rule.value}'`
            : rule.value;
        return `${rule.column.name} ${rule.comparison} ${value}`;
      }
      return rule.comparison.search("!=") || rule.comparison.search("NOT") >= 0
        ? `${rule.column.name} is not null`
        : `${rule.column.name} is null`;
    }
    return null;
  }

  static makeQuery(root) {
    const joins = root.rules.map(rule =>
      rule.operation
        ? SQLServerEngine.makeQuery(rule)
        : SQLServerEngine.makeComparison(rule)
    );
    const filtered = joins.filter(statement => statement != null);
    return filtered.join(` ${root.operation} `);
  }

  async getData(schema, table, criteria) {
    const sql = this.pool.request();
    const select = `select top ${GLOBAL_RECORDS_FETCH_LIMIT} * from ${schema}.dbo.${table}`;
    const statement = criteria ? `${select} where ${criteria}` : select;
    console.debug(statement);
    const results = await sql.query(statement);
    return results.recordset;
  }

  async getCount(schema, table) {
    const sql = this.pool.request();
    const statement = `select count(*) as count from ${schema}.dbo.${table}`;
    const results = await sql.query(statement);
    return results.recordset[0].count;
  }
}

module.exports = {
  type: "mssql",
  DatabaseEngine: SQLServerEngine
};
