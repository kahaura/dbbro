/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/prop-types */
import React from "react";
import { Input, Card, Icon, Header, Segment, List } from "semantic-ui-react";
import { Proxy } from "client/utils";
import ServerCreateModal from "client/server/server-create";
import ServerDropModal from "client/server/server-drop";
import Page from "client/page";

const capitalize = s => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const ServerOverview = ({ server, onServerRemoveClick }) => {
  const items = Object.keys(server.config)
    .filter(key => key != "options" && key != "password")
    .map((key, i) => (
      <List.Item key={i}>
        <List.Icon name="list" size="small" verticalAlign="middle" />
        <List.Content>
          <List.Header>
            {capitalize(key == "server" ? "host" : key)}
          </List.Header>
          <List.Description>{"" + server.config[key]}</List.Description>
        </List.Content>
      </List.Item>
    ));
  if (server.description) {
    items.push(
      <List.Item key={1000}>
        <List.Icon name="list" size="tiny" verticalAlign="middle" />
        <List.Content>
          <List.Header>Description</List.Header>
          <List.Description>{server.description}</List.Description>
        </List.Content>
      </List.Item>
    );
  }

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
          <a href={`/#/database?server=${server.name}`}>
            <Icon name="database" />
            <Header.Content>
              {server.name}
              <Header.Subheader>{server.type}</Header.Subheader>
            </Header.Content>
          </a>
        </Header>
      </Card.Content>
      <Card.Content style={{ minHeight: "183px" }}>
        <List divided relaxed>
          {items}
        </List>
      </Card.Content>
      <Card.Content extra>
        <div style={{ textAlign: "right" }}>
          <Icon link name="edit" />
          <Icon link name="remove" color="red" onClick={() => onServerRemoveClick(server.name)}/>
        </div>
      </Card.Content>
    </Card>
  );
};

const ServerList = ({ servers, filter, onServerRemoveClick }) => {
  const list = servers.filter(item => {
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
    <ServerOverview server={item} key={index} onServerRemoveClick={onServerRemoveClick} />
  ));
  return (
    <Segment vertical padded>
      <Card.Group>{cards}</Card.Group>
    </Segment>
  );
};

const Filter = ({ onCreateServerClick, onFilterChange }) => {
  return (
    <Segment basic vertical padded>
      <Input
        action={{
          color: "teal",
          labelPosition: "right",
          icon: "add",
          content: "Add server",
          onClick: onCreateServerClick
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

export default class ServerListPage extends React.Component {
  state = { servers: [], showAddForm: false, serverNameToRemove: null };

  render() {
    const { servers, filter, showAddForm, serverNameToRemove } = this.state;
    return (
      <Page>
        <Filter
          onCreateServerClick={() => this.setState({ showAddForm: true })}
          onFilterChange={filter => this.setState({ filter })}
        />
        <ServerList
          servers={servers}
          filter={filter}
          onServerRemoveClick={serverNameToRemove =>
            this.setState({ serverNameToRemove })
          }
        />
        <ServerCreateModal
          open={showAddForm}
          onClose={() => this.setState({ showAddForm: false })}
          onCreate={async () => await this.refreshList()}
        />
        <ServerDropModal
          dropServerName={serverNameToRemove}
          onClose={() => this.setState({ serverNameToRemove: null })}
          onDrop={async () => await this.refreshList()}
        />
      </Page>
    );
  }

  async refreshList() {
    const { error, result } = await new Proxy().get("/api/v1/server/find");
    this.setState({ error, servers: result });
  }

  async componentDidMount() {
    await this.refreshList();
  }
}
