import React from 'react'
import { getUrlParams, Proxy } from 'client/utils'
import { Segment, Button, Icon, Header, Modal } from 'semantic-ui-react'
import DataGrid from 'client/table/grid'
import QueryBuilder from 'client/table/query-builder'

const TableViewMenu = ({onFilter, onSearch, onSave, onAdd}) => (
    <Segment basic padded clearing>
        <Header floated='left' as='h2'>
            <Header.Content>
                {getUrlParams('name')}
                <a href={`/#/database?name=${getUrlParams('database')}`}>
                    <Header.Subheader>
                        <Icon name='database' />{getUrlParams('database')}
                   </Header.Subheader>
                </a>
            </Header.Content>
        </Header>
        <Button floated='right' color='blue' onClick={onSearch}><Icon name='search'/>Search</Button>
        <Button floated='right' onClick={onFilter}><Icon name='filter' />Filter</Button>
        <Button floated='right' ><Icon name='sort' />Sort</Button>
        <Button floated='right' onClick={onAdd}><Icon name='add' />Add</Button>
        <Button floated='right' color='red' onClick={onSave}><Icon name='save' />Save</Button>
    </Segment>
)

const ConfirmSaveModal = ({onReject, onConfim, open, saving}) => (
    <Modal size="mini" open={open} onClose={onReject}>
        <Modal.Header>Saves Changes</Modal.Header>
        <Modal.Content>
            <p>Are you sure you want to apply the changes to database?</p>
        </Modal.Content>
        <Modal.Actions>
            <Button negative onClick={onReject}>No</Button>
            <Button positive icon='checkmark' labelPosition='right' content='Yes' onClick={onConfim}/>
        </Modal.Actions>
    </Modal>
)

class TableBrowsePage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            stage: 0,
            info: null,
            records: [],
            name: getUrlParams('name'),
            database: getUrlParams('database'),
            showFilter: false,
            confirmSave: false,
            query: '',
        };
    }

    render() {
        const records = this.state.records
        const columns = this.state.info ? this.state.info.columns : []
        const showFilter = this.state.showFilter
        return (
            <div className='table-view-page'>
                <TableViewMenu 
                    onFilter={() => this.setState({showFilter: !showFilter})}
                    onSearch={() => this.loadData(this.state.query).then(data => this.setState(data))} 
                    onSave={() => this.setState({confirmSave: true})}
                    onAdd={() => this.addNewRecord(null)} />
                {showFilter &&
                    <QueryBuilder 
                        columns={columns} 
                        onQueryChange={query => {query}}
                        query={this.state.query}
                        />
                }
                <DataGrid 
                    columns={columns} 
                    records={records} 
                    onChange={changes => {
                        changes.forEach(({value, cell}) => {
                            cell.record.head[cell.key] = value;
                            cell.record.updated = !cell.record.inserted ? true : false;
                        })
                        this.forceUpdate();
                    }}
                    onDelete={(record => {
                        if(record.inserted) {
                            const cleaned = records.filter((r) => r != record)
                            this.setState({records: cleaned})
                        } else {
                            record.deleted = true
                            this.forceUpdate()
                        }
                    })}
                    onDuplicate={(record => {
                        const index = records.findIndex((r) => r == record)
                        const clone = JSON.parse(JSON.stringify(record))
                        clone.inserted = true
                        clone.updated = false
                        clone.deleted = false
                        records.splice(index, 0, clone)
                        this.setState({records: [...records]})
                    })}
                    onInsert={(record => {
                        const index = records.findIndex((r) => r == record)
                        this.addNewRecord(index)
                    })}
                    onMatch={(column, value) => this.addToFilter(column, value)}
                    />
                <ConfirmSaveModal 
                    open={this.state.confirmSave} 
                    onConfim={() => this.save().then(result => this.setState({confirmSave: false}))}
                    onReject={() => this.setState({confirmSave: false})} />
            </div>
        )
    }

    addToFilter(column, value) {

    }

    isDirty() {
        return this.state.records.find(r => r.updated || r.inserted || r.deleted)
    }

    addNewRecord(index) {
        const columns = this.state.info ? this.state.info.columns : null
        if(columns) {
            const r = Object.fromEntries(columns.map(c => [c.name, null]))
            const newRecord = {
                origin: r, 
                head: JSON.parse(JSON.stringify(r)), 
                removed: false, 
                updated: false,
                inserted: true,
            }
            const records = this.state.records
            index = index == null ? records.length : index
            records.splice(index + 1, 0, newRecord)
            this.setState({records: [...records]})
        }
    }

    async save() {
        console.debug('Going to save data to table.')
        const proxy = new Proxy()
        const updated = this.state.records.filter(r => r.updated)
        const inserted = this.state.records.filter(r => r.inserted)
        const deleted = this.state.records.filter(r => r.deleted)
        const changes = [...deleted, ...updated, ...inserted]
        if(changes.length > 0) {
            console.dir(changes)
            const body = await proxy.post(`/api/v1/${this.state.database}/sql/${this.state.name}/sync`, {records: changes})
            const json = await body.json()
            return json
        }
    }

    async loadData(query) {
        console.debug('Going to load table data...')
        const proxy = new Proxy()
        const params = query ? {query} : {};
        const body = await proxy.get(`/api/v1/${this.state.database}/sql/${this.state.name}`, params)
        const json = await body.json()
        const records = json.rows.map(r => ({
            origin: r, 
            head: JSON.parse(JSON.stringify(r)), 
            deleted: false, 
            updated: false,
            inserted: false,
        }))
        return {info: json.info, records}
    }

    componentDidUpdate(){
        console.debug('Component updatad')
    }

    async componentDidMount() {
        const data = await this.loadData()
        this.setState(data)
    }
}

export default TableBrowsePage;