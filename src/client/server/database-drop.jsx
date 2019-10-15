import React from "react";
import { Modal, Icon, Button, Input, Message } from "semantic-ui-react";
import { StateHolder, post, getUrlParams } from "client/utils";

const DatabaseDropModal = ({ onClose, onDrop, dropDatabaseName }) => (
  <StateHolder init={{ saving: false, name: "" }}>
    {(state, invalidate) => (
      <Modal open={dropDatabaseName ? true : false} onClose={onClose}>
        <Modal.Header>
          {state.saving ? <Icon loading name="ban" /> : <Icon name="ban" />}
          Drop database [{dropDatabaseName}]
        </Modal.Header>
        <Modal.Content>
          <Input focus error={state.name != dropDatabaseName} fluid icon="database" placeholder={`Type ${dropDatabaseName} here...`} onChange={e => invalidate({name: e.target.value})}/>
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
            content="Drop"
            onClick={async () => {
              // Save the changes then close
              const { server } = getUrlParams();
              invalidate({ saving: true });
              const { error } = await post(`/api/v1/database/drop`, {
                name: dropDatabaseName,
                server
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

export default DatabaseDropModal;
