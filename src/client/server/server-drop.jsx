import React from "react";
import { Modal, Icon, Button, Input, Message } from "semantic-ui-react";
import { StateHolder, post } from "client/utils";

const ServerDropModal = ({ onClose, onDrop, dropServerName }) => (
  <StateHolder init={{ saving: false, name: "" }}>
    {(state, invalidate) => (
      <Modal open={dropServerName ? true : false} onClose={onClose}>
        <Modal.Header>
          {state.saving ? <Icon loading name="ban" /> : <Icon name="ban" />}
          Remove server [{dropServerName}]
        </Modal.Header>
        <Modal.Content>
          <Input focus error={state.name != dropServerName} fluid icon="database" placeholder={`Type ${dropServerName} here...`} onChange={e => invalidate({name: e.target.value})}/>
          {state.error && <Message negative content={state.error}/>}
        </Modal.Content>
        <Modal.Actions>
          <Button positive onClick={onClose}>
            Cancel
          </Button>
          <Button
            negative
            icon="remove"
            labelPosition="right"
            content="Remove"
            onClick={async () => {
              // Save the changes then close
              invalidate({ saving: true });
              const { error } = await post(`/api/v1/server/remove`, {
                name: dropServerName,
              });
              invalidate({ saving: false, error });
              if (!error) {
                onDrop();
                onClose();
              }
            }}
          />
        </Modal.Actions>
      </Modal>
    )}
  </StateHolder>
);

export default ServerDropModal;
