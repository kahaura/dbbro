/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/prop-types */
import React from "react";
import Humanize from "humanize-plus";
import {
  Input,
  Card,
  Icon,
  List,
  Header,
  Segment,
  Message
} from "semantic-ui-react";
import { get } from "client/utils";
import { getUrlParams } from "client/utils";
import SchemaCreateModal from "client/database/schema-create";
import SchemaDropModal from "client/database/schema-drop";
import Page from "client/page";

const TableOverview = ({ tables }) => {
  const all = tables.map((e, index) => (
    <List.Item key={index}>
      <List.Content>
        <List.Header
          style={{
            textOverflow: "ellipsis",
            whiteSspace: "nowrap",
            overflow: "hidden"
          }}
        >
          {e}
        </List.Header>
      </List.Content>
    </List.Item>
  ));
  return (
    <List divided verticalAlign="middle" ordered>
      {all.slice(0, 7)}
    </List>
  );
};

const SchemaOverview = ({ schema, onSchemaDropClick }) => (
  <Card>
    <Card.Content>
      <Header
        as="h5"
        style={{
          textOverflow: "ellipsis",
          whiteSspace: "nowrap",
          overflow: "hidden"
        }}
      >
        <a
          href={`/#/table?server=${getUrlParams().server}&database=${getUrlParams().database}&schema=${
            schema.name
          }`}
        >
          <Icon name="database" />
          <Header.Content>
            {schema.name}
            <Header.Subheader>
              {schema.system ? "System schema" : "User schema"}
            </Header.Subheader>
          </Header.Content>
        </a>
      </Header>
    </Card.Content>
    <Card.Content style={{ minHeight: "183px" }}>
      <TableOverview tables={schema.tables} />
    </Card.Content>
    <Card.Content extra>
      <code>[{Humanize.intword(schema.tables.length, 1)}] Tables</code>
      <div style={{textAlign: 'right', marginTop: '-19px', height: '19px'}}>
        {!schema.system && (
          <Icon
            link
            name="remove"
            color="red"
            floated="right"
            onClick={() => onSchemaDropClick(schema.name)}
          />
        )}
      </div>
    </Card.Content>
  </Card>
);

const SchemaList = ({ schemas, filter, onSchemaDropClick }) => {
  const list = schemas.filter(item => {
    if (!filter) {
      return true;
    }
    const text = filter.toUpperCase();
    const data = Object.entries(item)
      .toString()
      .toUpperCase();
    return data.search(text) >= 0;
  });
  const tables = list.map((item, index) => (
    <SchemaOverview schema={item} key={index} onSchemaDropClick={onSchemaDropClick}/>
  ));
  return (
    <Segment vertical padded>
      <Card.Group>{tables}</Card.Group>
    </Segment>
  );
};

const Filter = ({ onCreateSchemaClick, onFilterChange }) => {
  return (
    <Segment basic vertical padded>
      <Input
        action={{
          color: "teal",
          labelPosition: "right",
          icon: "add",
          content: "Create schema",
          onClick: onCreateSchemaClick
        }}
        fluid
        icon="search"
        iconPosition="left"
        placeholder="Search..."
        onChange={e => onFilterChange(e.target.value)}
      />
    </Segment>
  );
};

export default class SchemaListPage extends React.Component {
  state = { schemas: [], showAddForm: false, dropSchemaName: null };

  render() {
    const { error, schemas, filter, showAddForm, dropSchemaName } = this.state;
    const invalidate = data => this.setState(data);
    return (
      <Page>
        <Filter
          onCreateSchemaClick={() => invalidate({ showAddForm: true })}
          onFilterChange={filter => invalidate({ filter })}
        />
        {error && <Message negative>{error}</Message>}
        <SchemaList schemas={error ? [] : schemas} filter={filter} onSchemaDropClick={(dropSchemaName) => invalidate({dropSchemaName})}/>
        <SchemaCreateModal
          open={showAddForm}
          onClose={() => this.setState({ showAddForm: false })}
          onCreate={async () => await this.refreshList()}
        />
        <SchemaDropModal
          dropSchemaName={dropSchemaName}
          onClose={() => this.setState({ dropSchemaName: null })}
          onDrop={async () => await this.refreshList()}
        />
      </Page>
    );
  }

  async refreshList() {
    console.debug('Schena list is refreshing...')
    const { server, database } = getUrlParams();
    const { error, result } = await get("/api/v1/schema/find", {
      server,
      database
    });
    console.debug(result);
    this.setState({ error, schemas: result });
  }

  async componentDidMount() {
    await this.refreshList();
  }
}
