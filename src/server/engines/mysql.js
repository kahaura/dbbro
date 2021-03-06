var Promise = require('bluebird');
const mysql = require("mysql");
const { GLOBAL_RECORDS_FETCH_LIMIT, runAsync, EngineBase } = require("./base");

class MySQLEngine extends EngineBase {
  constructor() {
    super();
    this.pool = null;
  }

  async destroy() {
    if (this.pool) {
      this.pool.end();
    }
  }

  async connect(config) {
    this.pool = await mysql.createPoolAsync(config);
  }

  async testConnection(config) {
    return new Promise((resolve, reject) => {
      const connection = mysql.createConnection(config);
      connection.connect(error => {
        if (error) {
          reject();
        } else {
          connection.end();
          resolve();
        }
      });
    });
  }

  async isHealthy() {
    try {
      if (this.pool) {
        await this.pool.query("select 'ping' as ping");
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  }

  async exec(query, database) {
    try {
      return new Promise((resolve, reject) => {
        this.pool.getConnection((err, cn) => {
          if(err) {
            reject(err);
          } else {
            cn.query(query, (err, results) => {
              cn.release();
              if(err) {
                reject(err);
              } else {
                resolve(results);
              }
            })
          }
        })
      })
      const sql = this.pool.request();
      if (database) {
        sql.query(`USE ${database}`);
      }
      return await sql.query(query);
    } catch (e) {
      console.error(`Error in executing [${query}]:${e}`);
      throw e;
    }
  }

  async getDatabases() {
    const statement = "SELECT name FROM master.dbo.sysdatabases";
    const databases = await this.exec(statement);
    const results = [];
    for (const row of databases.recordset) {
      const { name } = row;
      const result = {
        name,
        system:
          ["master", "tempdb", "model", "msdb"].indexOf(name.toLowerCase()) >= 0
      };
      result.schemas = await this.getSchemas(name);
      results.push(result);
    }
    return results;
  }

  async getSchemas(database) {
    const statement = `select s.name as name from ${database}.sys.schemas s inner join ${database}.sys.sysusers u on u.uid = s.principal_id where u.issqluser = 1`;
    const schemas = await this.exec(statement);
    const tables = await this.exec(
      `select schema_name(t.schema_id) as schemaName,
        t.name as tableName
      from ${database}.sys.tables t
        order by tableName`
    );
    const results = [];
    for (const row of schemas.recordset) {
      const { name } = row;
      const result = {
        name,
        system:
          ["sys", "guest", "dbo", "information_schema"].indexOf(
            name.toLowerCase()
          ) >= 0
      };
      result.tables = tables.recordset
        .filter(t => t.schemaName == name)
        .map(t => t.tableName);
      results.push(result);
    }
    return results.filter(r => !r.system || r.name == "dbo");
  }

  async getTables(database, schema) {
    const statement = `select schema_name(t.schema_id) as schemaName,
          t.name as tableName
        from ${database}.sys.tables t
        order by tableName`;
    //const statement = `select TABLE_NAME as tableName from ${schema}.INFORMATION_SCHEMA.TABLES where TABLE_TYPE like 'BASE TABLE'`;
    const tables = await this.exec(statement, database);
    const names = tables.recordset
      .filter(e => e.schemaName == schema)
      .map(e => e.tableName);
    const tasks = names.map(
      async tableName =>
        await this.getTableInformation(database, schema, tableName)
    );
    const results = await runAsync(tasks);
    return results;
  }

  async getPrimaryKey(database, schema, table) {
    const statement = `SELECT COLUMN_NAME as name FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE OBJECTPROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA + '.' + QUOTENAME(CONSTRAINT_NAME)), 'IsPrimaryKey') = 1 
          AND TABLE_NAME='${table}' and TABLE_SCHEMA='${schema}'`;
    const results = await this.exec(statement, database);
    return results.recordset.map(e => e.name);
  }

  async getTableInformation(database, schema, table) {
    const statement = `select COLUMN_NAME as name, 
      IS_NULLABLE as isNullable, 
      DATA_TYPE as dataType, 
      CHARACTER_MAXIMUM_LENGTH as strLength, NUMERIC_PRECISION as numLength from INFORMATION_SCHEMA.COLUMNS 
    where TABLE_NAME='${table}' and TABLE_SCHEMA='${schema}' order by ORDINAL_POSITION`;
    const results = await this.exec(statement, database);
    const pks = await this.getPrimaryKey(database, schema, table);
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
    console.dir(`Table [${database}.${schema}:${table}] fetched: ${info}`);
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

  async fetchDatatypeMap(database, schema, table) {
    const info = await this.getTableInformation(database, schema, table);
    const entries = info.columns.map(c => [c.name, c.dataType.toUpperCase()]);
    return Object.fromEntries(entries);
  }

  async getData(database, schema, table, criteria) {
    const select = `select top ${GLOBAL_RECORDS_FETCH_LIMIT} * from ${schema}.${table}`;
    const statement = criteria ? `${select} where ${criteria}` : select;
    const results = await this.exec(statement, database);
    return results.recordset;
  }

  async getCount(database, schema, table) {
    const statement = `select count(*) as count from ${schema}.${table}`;
    const results = await this.exec(statement, database);
    return results.recordset[0].count;
  }
}

module.exports = {
  type: "mysql",
  DatabaseEngine: MySQLEngine
};
