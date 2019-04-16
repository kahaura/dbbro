import React from 'react';
//import ReactDataGrid from 'react-data-grid';
import ReactDataSheet from 'react-datasheet';
import 'react-datasheet/lib/react-datasheet.css';
import { Popup, Menu, Dimmer } from 'semantic-ui-react';
import { StateHolder, Switch, Case, Default } from '../utils';
//import Spreadsheet from "react-spreadsheet/dist/SpreadsheetStateProvider";

const ContextMenu = ({top, left, show, onDelete, onDuplicate, onInsert, onClose, onUndelete, onMatch}) => (
    <Dimmer page active={show} onClick={onClose} style={{position: 'fixed', background: '#00000010'}}>
        <Switch>
            <Case when={onUndelete}>
                <Menu vertical>
                    <Menu.Item name='undelete' active={false} onClick={onUndelete}>
                        Undelete record
                    </Menu.Item>
                    <Menu.Item name='insert' active={false} onClick={onInsert}>
                        Insert new record
                    </Menu.Item>
                </Menu>
            </Case>
            <Default>
                <Menu vertical>
                    <Menu.Item name='delete' active={false} onClick={onDelete}>
                        Delete record
                    </Menu.Item>
                    <Menu.Item name='duplicate' active={false} onClick={onDuplicate}>
                        Duplicate
                    </Menu.Item>
                    <Menu.Item name='insert' active={false} onClick={onInsert}>
                        Insert new record
                    </Menu.Item>
                    {onMatch && 
                    <Menu.Item name='match' active={false} onClick={onMatch}>
                        Match
                    </Menu.Item>
                    }
                </Menu>
            </Default>
        </Switch>
    </Dimmer>
)

const DataGrid = ({columns, records, onChange, onDelete, onInsert, onDuplicate, onMatch}) => {
    const dbColumns = columns.map(c => ({readOnly: true, value:c.name, data: c}))
    const labels = [{readOnly:true, value: ''}, ...dbColumns]
    const rows = records.map((record, i) => {
        const index = {readOnly: true, value: i + 1}
        const data = columns.map(c => ({key: c.name, record, value: record.head[c.name], readOnly:record.deleted}))
        return [index, ...data]
    });
    const all = [labels, ...rows];
    return (
        <StateHolder init={{showContextMenu: false, selected: null}}>
        {(state, invalidate) =>
            <div style={{border: '1px solid whitesmoke', padding: '4px', marginLeft: '8px', marginRight: '8px', boxSizing: 'content-box'}}>
                <ReactDataSheet 
                    overflow='clip'
                    valueRenderer={cell => cell.value}
                    data={all}
                    onCellsChanged={onChange}
                    onContextMenu={(e, cell, j, i) => {
                        e.preventDefault()
                        if(j > 0) {
                            invalidate({
                                showContextMenu: true, 
                                selected: {
                                    row: rows[j - 1],
                                    record: rows[j - 1][1].record,
                                    column: labels[i],
                                    value: cell.value,
                                    canMatch: i > 0
                                }
                            })
                        }
                    }}/>
                <ContextMenu 
                    show={state.showContextMenu} 
                    onDelete={() => onDelete(state.selected.record)}
                    onDuplicate={() => onDuplicate(state.selected.record)}
                    onInsert={() => onInsert(state.selected.record)}
                    onMatch={state.selected && state.selected.canMatch ? () => onMatch(state.selected.column, value) : null}
                    onClose={() => invalidate({showContextMenu: false})} 
                    onUndelete={state.selected && state.selected.record.deleted ? () => state.selected.record.deleted = false : null}/>
            </div>
        }
        </StateHolder>
    )
}

export default DataGrid;