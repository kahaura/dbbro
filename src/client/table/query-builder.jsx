import React from 'react';
import { StateHolder } from 'client/utils';
import { Segment, Button, Comment, Dropdown, Icon, Label, SegmentGroup, Input, Form, Select, Grid, Container, Menu } from 'semantic-ui-react';

const Operation = ({condition, invalidate}) => {
    const color = condition.operation == 'AND' ? 'blue' : 'green';
    const icon = condition.operation == 'AND' ? 'chevron up' : 'chevron down'
    return (
        <Button size='mini' icon={icon} color={color} onClick={() => {
            condition.operation = condition.operation == 'AND' ? 'OR' : 'AND';
            invalidate();
        }}/>
    );
};

const Rule = ({columns, condition, invalidate}) => {
    const fields = columns.map((c) => ({key: c.name, text: c.name, value: c.name}));
    const dataType = condition.column ? condition.column.dataType.toUpperCase() : null;
    const operations = ['CHAR', 'VARCHAR', 'NVARCHAR', 'NCHAR'].indexOf(dataType) >= 0
        ? [
            {key: 'LIKE', text: 'Like', value: 'LIKE'},
            {key: 'NOT LIKE', text: 'Not like', value: 'NOT LIKE'},
            {key: '>=', text: '>=', value: '>='},
            {key: '<=', text: '<=', value: '<='},
            {key: '>', text: '>', value: '>'},
            {key: '<', text: '<', value: '<'}
        ] : [
            {key: '==', text: '==', value: '=='},
            {key: '!=', text: '!=', value: '!='},
            {key: '>=', text: '>=', value: '>='},
            {key: '<=', text: '<=', value: '<='},
            {key: '>', text: '>', value: '>'},
            {key: '<', text: '<', value: '<'}
        ];
    const type = ['DATETIME', 'TIMESTAMP'].indexOf(dataType) >= 0
        ? 'date'
        : ['INT', 'FLOAT', 'NUMERIC'].indexOf(dataType) >= 0 ? 'number' : 'text';
    return (
        <Container fluid>
            <Button 
                floated='left' 
                color='red' 
                size='mini' 
                icon='remove' 
                style={{marginLeft: '8px', marginTop: '13px'}}
                onClick={() => {
                    condition.parent.rules = condition.parent.rules.filter(r => r != condition)
                    invalidate();
                }} />
            <Grid columns='equal' style={{marginTop: '2px'}}>
                <Grid.Column>
                    <Select
                        fluid
                        placeholder='Select field'
                        selection
                        options={fields}
                        onChange={(e, data) => {
                            condition.column = columns.find((c) => c.name == data.value);
                            condition.comparison = null;
                            condition.value = null;
                            invalidate();
                        }}/>
                </Grid.Column>
                <Grid.Column>
                    <Select
                        disabled={!condition.column}
                        fluid
                        placeholder='Operation'
                        selection
                        options={operations}
                        onChange={(e, data) => {
                            condition.comparison = data.value;
                            invalidate();
                        }}/>
                </Grid.Column>
                <Grid.Column width={8}>
                    <Input 
                        type={type}
                        disabled={!condition.comparison}
                        fluid
                        onChange={(e) => {
                        condition.value = e.target.value;
                        invalidate();
                    }} />
                </Grid.Column>
            </Grid>
        </Container>
    );
};

const Group = ({columns, state, condition, invalidate, onReset, onApply}) => {
    const children = condition.rules.map((rule, index) => {
        return rule.operation
            ? <Group key={index} columns={columns} state={state} condition={rule} invalidate={invalidate}/>
            : <Rule key={index} columns={columns} condition={rule} invalidate={invalidate}/>
    });
    return (
        <Segment basic size='mini' style={{background: '#f5f5f588', border: '1px solid #e0e0e0'}}>
            <Operation condition={condition} invalidate={invalidate}/>
            <Button size='mini' icon='add' onClick={() => {
                condition.rules.push({column: null, comparison: null, value: null, parent: condition});
                invalidate();
            }} />
            <Button size='mini' icon='object group outline' onClick={() => {
                condition.rules.push({operation:'AND', rules: [], parent: condition});
                invalidate();
            }} />
            <Button size='mini' icon='remove' color='red' onClick={() => {
                if(condition.parent) {
                    condition.parent.rules = condition.parent.rules.filter((r) => r != condition)
                } else {
                    condition.operation = 'AND'
                    condition.rules = []
                }
                invalidate();
            }} />
            {children}
        </Segment>
    );
};

const makeComparison = (rule) => {
    if(rule.comparison != null && rule.column != null && rule.value != null) {
        const value = ['CHAR', 'VARCHAR', 'NVARCHAR', 'NCHAR'].indexOf(rule.column.dataType.toUpperCase()) >= 0
            ? `'${rule.value}'`
            : rule.value;
        return `${rule.column.name} ${rule.comparison} ${value}`;
    }
    return null;
};

const makeQuery = (root) => {
    const joins = root.rules.map(rule => rule.operation ? makeQuery(rule) : makeComparison(rule));
    const filtered = joins.filter(statement => statement != null);
    return filtered.join(` ${root.operation} `);
};

const QueryBuilder = ({columns, onQueryChange, query}) => (
    <div style={{border: '1px solid whitesmoke', padding: '4px', margin: '8px'}}>
        <StateHolder init={{root: {operation:'AND', rules: []}}}>
            {(state, invalidate) => {
                const lastQuery = makeQuery(state.root);
                if(onQueryChange && query != lastQuery){
                    onQueryChange(lastQuery);
                }
                return (
                    <Group 
                        columns={columns}
                        state={state} 
                        invalidate={invalidate} 
                        condition={state.root} />
                );
            }}
        </StateHolder>
    </div>
)

export default QueryBuilder
