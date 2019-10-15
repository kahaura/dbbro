/* eslint-disable react/no-array-index-key */
/* eslint-disable react/prop-types */
/* eslint-disable no-nested-ternary */
import React from 'react';
import Humanize from 'humanize-plus';
import {
  Input, Card, Icon, List, Header, Segment, Message
} from 'semantic-ui-react';
import { get, Query, getUrlParams, When } from 'client/utils';
import Page from "client/page";

const FieldsOverview = ({ data }) => {
  const columns = [...data.columns];
  const fields = columns.map((e, index) => {
    const size = e.strLength ? e.strLength : e.numLength ? e.numLength : -1;
    const humanReadableSize = size < 0 ? '-' : size > 1024 ? Humanize.fileSize(size) : size;
    return (
      <List.Item key={index}>
        <List.Content floated="right">
          {e.dataType.toUpperCase()}
          <code>{`(${humanReadableSize})`}</code>
        </List.Content>
        <List.Content>
          <List.Header
            style={{
              textOverflow: 'ellipsis',
              whiteSspace: 'nowrap',
              overflow: 'hidden'
            }}
          >
            {e.isPrimary && <Icon name="key" />}
            {e.name}
          </List.Header>
        </List.Content>
      </List.Item>
    );
  });
  return (
    <List divided verticalAlign="middle" ordered>
      {fields.slice(0, 7)}
    </List>
  );
};

const TableOverview = ({ data }) => {
  const loading = <Icon loading name="asterisk" />
  const {server, database, schema} = getUrlParams()
  return (
    <Card>
      <Card.Content>
        <Header
          as="h5"
          style={{
            textOverflow: 'ellipsis',
            whiteSspace: 'nowrap',
            overflow: 'hidden'
          }}
        >
          <a href={`/#/browse?server=${server}&database=${database}&schema=${schema}&table=${data.name}`}>
            <Icon floated="right" name="table" />
            <Header.Content>{data.name}</Header.Content>
          </a>
        </Header>
      </Card.Content>
      <Card.Content style={{ minHeight: '183px' }}>
        <FieldsOverview data={data} />
      </Card.Content>
      <Card.Content extra>
        <Query 
          path={`/api/v1/table/sql/count`} 
          params={{server, database, schema, table:data.name}} 
          loading={loading} >
          {({error, result}) => (
            <React.Fragment>
              <Icon name="calculator" />
              <code>
[
                {error ? '!' : Humanize.intword(result.count, 1)}
] Rows
              </code>
            </React.Fragment>
          )}
        </Query>
      </Card.Content>
    </Card>
  );
};

const TableList = ({ list, filter }) => {
  const filterred = list.filter((item) => {
    if (!filter) {
      return true;
    }
    const text = filter.toUpperCase();
    const data = Object.entries(item)
        .toString()
        .toUpperCase();
    return data.search(text) >= 0;
  });
  const tables = filterred.map((item, index) => <TableOverview data={item} key={index} />);
  return (
    <Segment vertical padded>
      <Card.Group>{tables}</Card.Group>
    </Segment>
  );
};

const Filter = ({ onFilterChange }) => {
  return (
    <Segment basic vertical padded>
      <Input
        fluid
        icon="search"
        iconPosition="left"
        placeholder="Search..."
        onChange={e => onFilterChange(e.target.value)}
      />
    </Segment>
  );
};


export default class TableListPage extends React.Component {
  state = {
    error: null,
    list: [],
    filter: ''
  }
  
  render() {
    const {list, error, filter} = this.state;
    const invalidate = (data) => this.setState(data);
    return (
      <Page>
        <Filter onFilterChange={(filter) => invalidate({filter})} />
        <When condition={error}>
          <Message negative content={error} />
        </When>
        <TableList
          list={list}
          filter={filter}
        />
      </Page>
    )
  }

  async refreshList() {
    const {server, database, schema} = getUrlParams();
    const {result, error} = await get('/api/v1/table/find', {server, database, schema});
    this.setState({error, list: error ? [] : result});
  }

  async componentDidMount() {
    await this.refreshList();
  }
}
