/* eslint-disable import/no-unresolved */
/* eslint-disable no-param-reassign */
/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { getUrlParams, Proxy, When } from 'client/utils';
import {
  Segment, Button, Icon, Header, Modal, Message
} from 'semantic-ui-react';
import DataGrid from 'client/table/grid';
import Page from 'client/page';
import QueryBuilder from 'client/table/query-builder';

const TableViewMenu = ({
  onFilter, onSearch, onSave, onAdd
}) => (
  <Page>
    <Segment basic clearing>
    <Header floated="left" as="h2">
      <Header.Content>
        {getUrlParams('table')}
        <a href={`/#/schema?server=${getUrlParams().server}&database=${getUrlParams().database}&schema=${getUrlParams().schema}`}>
          <Header.Subheader>
            <Icon name="database" />
            {getUrlParams('schema')}
          </Header.Subheader>
        </a>
      </Header.Content>
    </Header>
    <Button floated="right" color="blue" onClick={onSearch}>
      <Icon name="search" />
      Search
    </Button>
    <Button floated="right" onClick={onFilter}>
      <Icon name="filter" />
      Filter
    </Button>
    <Button floated="right">
      <Icon name="sort" />
      Sort
    </Button>
    <Button floated="right" onClick={onAdd}>
      <Icon name="add" />
      Add
    </Button>
    <Button floated="right" color="red" onClick={onSave}>
      <Icon name="save" />
      Save
    </Button>
    </Segment>
  </Page>
);

const ConfirmSaveModal = ({
  onReject, onConfim, open, saving, saveError
}) => (
  <Modal size="mini" open={open} onClose={onReject}>
    <Modal.Header>
    {<Icon loading={saving} name="setting" />}
      Saves Changes
    </Modal.Header>
    <When condition={saveError}>
      <Message negative content={saveError}/>
    </When>
    <Modal.Content>
      <p>Are you sure you want to apply the changes to database?</p>
    </Modal.Content>
    <Modal.Actions>
      <Button negative onClick={onReject}>
        No
      </Button>
      <Button positive icon="checkmark" labelPosition="right" content="Yes" onClick={onConfim} />
    </Modal.Actions>
  </Modal>
);

class TableBrowsePage extends React.Component {
  state = {
    error: null,
    info: null,
    records: [],
    showFilter: false,
    confirmSave: false,
    rule: QueryBuilder.create(),
    saving: false,
    saveError: null,
  }

  async componentDidMount() {
    const data = await this.loadData();
    this.setState(data);
  }

  addToFilter(column, value) {
    const { rule } = this.state;
    QueryBuilder.addRule(rule, column, value);
    this.setState({ rule });
  }

  isDirty() {
    return this.state.records.find(r => r.updated || r.inserted || r.deleted);
  }

  addNewRecord(index) {
    const columns = this.state.info ? this.state.info.columns : null;
    if (columns) {
      const r = Object.fromEntries(columns.map(c => [c.name, null]));
      const newRecord = {
        origin: r,
        head: JSON.parse(JSON.stringify(r)),
        removed: false,
        updated: false,
        inserted: true
      };
      const { records } = this.state;
      const where = index == null ? records.length : index;
      records.splice(where + 1, 0, newRecord);
      this.setState({ records: [...records] });
    }
  }

  async save() {
    console.debug('Going to save data to table.');
    this.setState({ saving: true });
    const proxy = new Proxy();
    const {server, database, schema, table} = getUrlParams()
    const updated = this.state.records.filter(r => r.updated);
    const inserted = this.state.records.filter(r => r.inserted);
    const deleted = this.state.records.filter(r => r.deleted && !r.inserted);
    const changes = [...deleted, ...updated, ...inserted];
    if (changes.length > 0) {
      console.dir(changes);
      return await proxy.post(`/api/v1/table/sql/sync`, {
        server, 
        database,
        schema,
        table,
        records: changes
      });
    }
    return null;
  }

  async loadData() {
    const {server, database, schema, table} = getUrlParams()
    console.debug('Going to load table data...');
    const proxy = new Proxy();
    const criteria = QueryBuilder.toSQL(this.state.rule);
    const {error, result} = await proxy.get(`/api/v1/table/sql/browse`, { server, database, schema, table, criteria });
    const records = error ? [] : result.rows.map(r => ({
      origin: r,
      head: JSON.parse(JSON.stringify(r)),
      deleted: false,
      updated: false,
      inserted: false
    }));
    return { info: error ? null : result.info, records, error};
  }

  render() {
    const { records, error, showFilter } = this.state;
    const columns = this.state.info ? this.state.info.columns : [];
    return (
      <div className="table-view-page">
        <TableViewMenu
          onFilter={() => this.setState({ showFilter: !showFilter })}
          onSearch={() => this.loadData().then(data => this.setState(data))}
          onSave={() => this.setState({ confirmSave: true })}
          onAdd={() => this.addNewRecord(null)}
        />
        {showFilter && (
          <QueryBuilder
            rule={this.state.rule}
            columns={columns}
            onChange={rule => this.setState({ rule })}
          />
        )}
        {error && 
          <Message negative>{error}</Message>
        }
        <DataGrid
          columns={columns}
          records={records}
          onChange={(changes) => {
            changes.forEach(({ value, cell }) => {
              cell.record.head[cell.key] = value;
              cell.record.updated = !cell.record.inserted;
            });
            this.forceUpdate();
          }}
          onDelete={(record) => {
            if (record.inserted) {
              const cleaned = records.filter(r => r != record);
              this.setState({ records: cleaned });
            } else {
              record.deleted = true;
              this.forceUpdate();
            }
          }}
          onDuplicate={(record) => {
            const index = records.findIndex(r => r == record);
            const clone = JSON.parse(JSON.stringify(record));
            clone.inserted = true;
            clone.updated = false;
            clone.deleted = false;
            records.splice(index, 0, clone);
            this.setState({ records: [...records] });
          }}
          onInsert={(record) => {
            const index = records.findIndex(r => r == record);
            this.addNewRecord(index);
          }}
          onMatch={(column, value) => this.addToFilter(column, value)}
        />
        <ConfirmSaveModal
          saving={this.state.saving}
          open={this.state.confirmSave}
          error={this.state.saveError}
          onConfim={() => {
            const {error} = this.save();
            if(error) {
              this.setState({saveError: error, saving:false})
            } else {
              const filtered = records.filter(r => !r.deleted);
              this.setState({ confirmSave: false, saving: false, records: filtered });
            }
          }}
          onReject={() => this.setState({ confirmSave: false })}
        />
      </div>
    );
  }
}

export default TableBrowsePage;
