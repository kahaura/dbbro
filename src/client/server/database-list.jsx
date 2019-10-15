/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/prop-types */
import React from "react";
import {
  Input,
  Card,
  Icon,
  Header,
  Segment,
  Message,
  List
} from "semantic-ui-react";
import { get, getUrlParams } from "client/utils";
import DatabaseCreateModal from "client/server/database-create";
import DatabaseDropModal from "client/server/database-drop";
import Page from "client/page";

const DatabaseOverview = ({ database, onDatabaseDropClick }) => {
  const items = database.schemas.map((schema, i) => (
    <List.Item key={i}>
      <List.Icon name="list" size="small" verticalAlign="middle" />
      <List.Content>{schema.name}</List.Content>
    </List.Item>
  ));
  return (
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
            href={`/#/schema?server=${getUrlParams().server}&database=${
              database.name
            }`}
          >
            <Icon name="database" />
            <Header.Content>
              {database.name}
              <Header.Subheader>
                {database.system ? "System" : "User"}
              </Header.Subheader>
            </Header.Content>
          </a>
        </Header>
      </Card.Content>
      <Card.Content style={{ minHeight: "183px" }}>
        <List divided relaxed>
          {items.slice(0, 6)}
        </List>
      </Card.Content>
      <Card.Content extra >
        <div style={{ position: "absolute" }}>
          [{database.schemas.length}] Schemas
        </div>
          <div style={{ textAlign: "right", height: '19px' }}>
          {!database.system && (
            <Icon
              link
              name="remove"
              color="red"
              floated="right"
              onClick={() => onDatabaseDropClick(database.name)}
            />
            )}
            </div>
      </Card.Content>
    </Card>
  );
};

const DatabaseList = ({ databases, filter, onDatabaseDropClick }) => {
  const list = databases.filter(item => {
    if (!filter) {
      return true;
    }
    const text = filter.toUpperCase();
    const data = Object.entries(item)
      .toString()
      .toUpperCase();
    return data.search(text) >= 0;
  });
  const cards = list.map((item, index) => (
    <DatabaseOverview
      database={item}
      key={index}
      onDatabaseDropClick={onDatabaseDropClick}
    />
  ));
  return (
    <Segment vertical padded>
      <Card.Group>{cards}</Card.Group>
    </Segment>
  );
};

const Filter = ({ onCreateDatabaseClick, onFilterChange }) => {
  return (
    <Segment basic vertical padded>
      <Input
        action={{
          color: "teal",
          labelPosition: "right",
          icon: "add",
          content: "Create database",
          onClick: onCreateDatabaseClick
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

export default class DatabaseListPage extends React.Component {
  state = { databases: [], showAddForm: false, dropDatabaseName: null };

  render() {
    const {
      error,
      databases,
      filter,
      showAddForm,
      dropDatabaseName
    } = this.state;
    return (
      <Page>
        <Filter
          onCreateDatabaseClick={() => this.setState({ showAddForm: true })}
          onFilterChange={filter => this.setState({ filter })}
        />
        <DatabaseList
          databases={error ? [] : databases}
          filter={filter}
          onDatabaseDropClick={dropDatabaseName =>
            this.setState({ dropDatabaseName })
          }
        />
        <DatabaseCreateModal
          open={showAddForm}
          onClose={() => this.setState({ showAddForm: false })}
          onCreate={async () => await this.refreshList()}
        />
        <DatabaseDropModal
          dropDatabaseName={dropDatabaseName}
          onClose={() => this.setState({ dropDatabaseName: null })}
          onDrop={async () => await this.refreshList()}
        />
        {error && <Message negative content={error} />}
      </Page>
    );
  }

  async refreshList() {
    const { server } = getUrlParams();
    const { error, result } = await get("/api/v1/database/find", {
      server
    });
    this.setState({ error, databases: result });
  }

  async componentDidMount() {
    await this.refreshList();
  }
}
