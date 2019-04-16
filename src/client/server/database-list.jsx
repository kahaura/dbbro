import React from 'react'
import Humanize from 'humanize-plus';
import { Input, Card, Icon, List, Header, Segment, Dropdown } from 'semantic-ui-react';
import { StateHolder, Query } from 'client/utils';

const TableOverview = ({tables}) => {
    const all = tables.map((e, index) => {
        return (
            <List.Item key={index}>
                <List.Content>
                    <List.Header style={{    
                        textOverflow: 'ellipsis',
                        whiteSspace: 'nowrap',
                        overflow: 'hidden'
                    }}>
                        {e}
                    </List.Header>
                </List.Content>
            </List.Item>
        );
    });
    return (
        <List divided verticalAlign='middle' ordered> 
            {all.slice(0, 7)}
        </List>
    );
}

const DatabaseOverview = ({database}) => {
    const loading = (
        <Icon loading name='asterisk' /> 
    );
    return (
        <Card>
            <Card.Content>
                <Header as='h5' style={{    
                        textOverflow: 'ellipsis',
                        whiteSspace: 'nowrap',
                        overflow: 'hidden'
                }}>
                    <a href={`/#/database?name=${database.name}`}>
                        <Icon name='database' />
                        <Header.Content>
                            {database.name}
                            <Header.Subheader>{database.system ? 'System schema' : 'User schema'}</Header.Subheader>
                        </Header.Content>
                    </a>
            </Header>
            </Card.Content>
            <Card.Content style={{minHeight: '183px'}}>
                <TableOverview tables={database.tables}/>
            </Card.Content>
            <Card.Content extra>
                <code>[{Humanize.intword(database.tables.length, 1)}] Tables</code>
            </Card.Content>                    
        </Card>
    )
};

const DatabaseList = ({databases, filter, filterType}) => {
    const list = databases.filter((item) => {
        if(!filter) {
            return true;
        }
        const text = filter.toUpperCase();
        const data = filterType == 'full' 
            ? Object.entries(item).toString().toUpperCase()
            : filterType == 'tables'
                ? Object.entries(item.tables).toString().toUpperCase()
                : item.name.toUpperCase();
        return data.search(text) >= 0;
    });
    const tables = list.map((item, index) => <DatabaseOverview database={item} key={index} />);
    return (
        <Segment vertical padded>
            <Card.Group> 
                {tables}
            </Card.Group>
        </Segment>
    );
}

const Filter = ({state, invalidate}) => {
    const searchOptions = [
        {key: 'databases', text: 'Databases', value: 'databases'},
        {key: 'tables', text: 'Tables', value: 'tables'},
        {key: 'full', text: 'Full', value: 'full'},
    ];
    const defaultFilterType = state.filterType ? state.filterType : 'databases';
    const FilterType = () => (
        <Dropdown 
            button 
            basic 
            floating 
            options={searchOptions} 
            defaultValue={defaultFilterType} 
            onChange={(e, {value}) => invalidate({filterType: value})}/>
    )
    return (
        <Segment basic vertical padded>
            <Input 
                action={<FilterType />}
                fluid 
                icon='search' 
                iconPosition='left'
                placeholder='Search...' 
                onChange={(e) => invalidate({filter: e.target.value})}/>
        </Segment>
    );
};

const DatabaseListPage = () => (
    <Query path='/api/v1/databases'>
        {(list) => {
            return (
                <div className='home' style={{padding: '16px'}}>
                    <StateHolder init={{filterType: 'databases'}}>
                        {(state, invalidate) => (
                            <div className='databases'>
                                <Filter state={state} invalidate={invalidate}/>
                                <DatabaseList databases={list} filter={state.filter} filterType={state.filterType} />
                            </div>
                        )}
                    </StateHolder>
                </div>
            );
        }}
    </Query>
)

export default DatabaseListPage;
