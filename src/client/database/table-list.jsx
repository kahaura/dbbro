import React from 'react'
import Humanize from 'humanize-plus';
import { Input, Checkbox, Card, Icon, List, Header, Segment, Dropdown} from 'semantic-ui-react';
import { StateHolder, Query, getUrlParams } from 'client/utils';

const FieldsOverview = ({data}) => {
    const columns = [...data.columns];
    const fields = columns.map((e, index) => {
        const size = e.strLength ? e.strLength : e.numLength ? e.numLength : -1;
        const humanReadableSize = size < 0 ? '-' : size > 1024 ? Humanize.fileSize(size) : size;
        return (
            <List.Item key={index}>
                <List.Content floated='right'>
                    {e.dataType.toUpperCase()}<code>({humanReadableSize})</code>
                </List.Content>
                <List.Content>
                    <List.Header style={{    
                        textOverflow: 'ellipsis',
                        whiteSspace: 'nowrap',
                        overflow: 'hidden'
                    }}>
                        {e.isPrimary && <Icon name='key'/>}{e.name}
                    </List.Header>
                </List.Content>
            </List.Item>
        );
    });
    return (
        <List divided verticalAlign='middle' ordered> 
            {fields.slice(0, 7)}
        </List>
    );
}

const TableOverview = ({data}) => {
    const loading = (
        <Icon loading name='asterisk' /> 
    );
    return (
        <Card>
            <Card.Content>
                <Header href={`/#/table?database=${data.database}&name=${data.name}`} as='a' style={{    
                        textOverflow: 'ellipsis',
                        whiteSspace: 'nowrap',
                        overflow: 'hidden'
                }}>
                    <Icon floated='right' name='table' />
                    <Header.Content>
                        {data.name}
                    </Header.Content>
                </Header>
            </Card.Content>
            <Card.Content style={{minHeight: '183px'}}>
                <FieldsOverview data={data}/>
            </Card.Content>
            <Card.Content extra>
                <Query path={`/api/v1/${getUrlParams('name')}/sql/${data.name}/count`} loading={loading}>
                    {(result) => (
                        <React.Fragment>
                            <Icon name='calculator' />
                            <code>[{Humanize.intword(result.count, 1)}] Rows</code>
                        </React.Fragment>
                    )}
                </Query>
            </Card.Content>                    
        </Card>
    )
};

const TableList = ({list, filter, filterType}) => {
    const filterred = list.filter((item) => {
        if(!filter) {
            return true;
        }
        const text = filter.toUpperCase();
        const data = filterType == 'full' 
            ? Object.entries(item).toString().toUpperCase()
            : filterType == 'fields'
                ? Object.entries(item.columns).toString().toUpperCase()
                : item.name.toUpperCase();
        return data.search(text) >= 0;
    });
    const tables = filterred.map((item, index) => <TableOverview data={item} key={index}/>);
    return (
        <Segment vertical padded>
            <Card.Group centered> 
                {tables}
            </Card.Group>
        </Segment>
    );
}

const Filter = ({state, invalidate}) => {
    const searchOptions = [
        {key: 'tables', text: 'Tables', value: 'tables'},
        {key: 'fields', text: 'Fields', value: 'fields'},
        {key: 'full', text: 'Full', value: 'full'},
    ];
    const defaultFilterType = state.filterType ? state.filterType : 'tables';
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

const TableListPage = () => (
    <Query path={`/api/v1/${getUrlParams('name')}/tables`}>
        {(results) => {
            return (
                <div className='home' style={{padding: '16px'}}>
                    <StateHolder init={{filterType: 'tables'}}>
                        {(state, invalidate) => (
                            <div className='tables'>
                                <Filter state={state} invalidate={invalidate}/>
                                <TableList list={results} filter={state.filter} filterType={state.filterType} z={console.debug(state.filterType)}/>
                            </div>
                        )}
                    </StateHolder>
                </div>
            );
        }}
    </Query>
)

export default TableListPage;
