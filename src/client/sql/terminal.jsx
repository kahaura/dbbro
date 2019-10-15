import React from "react";
import { Modal } from "semantic-ui-react";
import { Console } from "client/sql/console";

const SQLTerminal = ({ onClose, open }) => (
  <Modal open={open} onClose={onClose} style={{width: '90%', height: '90%' }} className='terminal-modal'>
    <Modal.Content style={{background: 'black'}}>
      <Console prompt='SQL>'/>
    </Modal.Content>
  </Modal>
);

export default SQLTerminal;
