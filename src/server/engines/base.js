const { settings } = require("../config");

const GLOBAL_RECORDS_FETCH_LIMIT = settings.globals.recordsFetchLimit;

// eslint-disable-next-line no-undef
const runAsync = async tasks => await Promise.all(tasks);


class EngineBase {
    async testConnection(config) {
    }
    
    async exec(query, database) {
    }
  
    async createDatabase(name) {
      const statement = `CREATE DATABASE ${name}`;
      await this.exec(statement);
    }
  
    async dropDatabase(name) {
      const statement = `DROP DATABASE ${name}`;
      await this.exec(statement);
    }
  
    async createSchema(database, name) {
      const statement = `CREATE SCHEMA ${name}`;
      await this.exec(statement, database);
    }
  
    async dropSchema(database, name) {
      const statement = `USE ${database};DROP SCHEMA ${name}`;
      await this.exec(statement);
    }
    
    async getDatabases() {
    }
  
    async getSchemas(database) {
    }
  
    async getTables(database, schema) {
    }
  
    async getPrimaryKey(database, schema, table) {
    }
  
    async getTableInformation(database, schema, table) {
    }
  
    formatValue(dataType, value) {
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
    }
  
    async updateTableRecords(database, schema, table, updates) {
      const dataTypes = await this.fetchDatatypeMap(database, schema, table);
      const toSQL = (column, value) =>
        this.formatValue(dataTypes[column], value);
      const getProperOperation = (column, value) => (value != null ? "=" : "is");
      if (updates.length > 0) {
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
          const statement = `UPDATE ${schema}.${table} SET ${set} WHERE ${where}`;
          await this.exec(statement, database);
        });
        await runAsync(tasks);
      }
      return updates.length;
    }
  
    async insertNewRecords(database, schema, table, inserts) {
      const info = await this.getTableInformation(database, schema, table);
      const dataTypes = Object.fromEntries(
        info.columns.map(c => [c.name, c.dataType.toUpperCase()])
      );
      const toSQL = (column, value) =>
        this.formatValue(dataTypes[column], value);
      if (inserts.length > 0) {
        const tasks = inserts.map(async r => {
          const fields = info.columns.map(c => c.name).join(", ");
          const values = info.columns
            .map(c => toSQL(c.name, r.head[c.name]))
            .join(", ");
          const statement = `INSERT INTO ${schema}.${table} (${fields}) VALUES(${values})`;
          await this.exec(statement, database);
        });
        await runAsync(tasks);
      }
      return inserts.length;
    }
  
    async deleteTableRecords(database, schema, table, deletes) {
      const dataTypes = await this.fetchDatatypeMap(database, schema, table);
      const toSQL = (column, value) =>
        this.formatValue(dataTypes[column], value);
      if (deletes.length > 0) {
        const tasks = deletes.map(async r => {
          const where = Object.keys(r.origin)
            .map(key => `${key} = ${toSQL(key, r.origin[key])}`)
            .join(" AND ");
          const statement = `DELETE FROM ${schema}.${table} WHERE ${where}`;
          await this.exec(statement, database);
        });
        await runAsync(tasks);
      }
      return deletes.length;
    }
  
    async syncTable(database, schema, table, records) {
      const updates = records.filter(r => r.updated);
      const inserts = records.filter(r => r.inserted);
      const deletes = records.filter(r => r.deleted);
      const updated = await this.updateTableRecords(
        database,
        schema,
        table,
        updates
      );
      const inserted = await this.insertNewRecords(
        database,
        schema,
        table,
        inserts
      );
      const deleted = await this.deleteTableRecords(
        database,
        schema,
        table,
        deletes
      );
      return { updated, inserted, deleted };
    }
  
    makeComparison(rule) {
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
  
    makeQuery(root) {
      const joins = root.rules.map(rule =>
        rule.operation
          ? this.makeQuery(rule)
          : this.makeComparison(rule)
      );
      const filtered = joins.filter(statement => statement != null);
      return filtered.join(` ${root.operation} `);
    }
  
    async getData(database, schema, table, criteria) {
    }
  
    async getCount(database, schema, table) {
    }
  }
  
module.exports = {
  GLOBAL_RECORDS_FETCH_LIMIT,
  runAsync,
  EngineBase
};

