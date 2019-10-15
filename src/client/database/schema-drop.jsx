import React from "react";
import { Modal, Icon, Button, Input, Message, Header } from "semantic-ui-react";
import { StateHolder, post, getUrlParams } from "client/utils";

const SchemaDropModal = ({ onClose, onDrop, dropSchemaName }) => (
  <StateHolder init={{ saving: false, name: "" }}>
    {(state, invalidate) => (
      <Modal open={dropSchemaName ? true : false} onClose={onClose}>
        <Modal.Header>
          {state.saving ? <Icon loading name="ban" /> : <Icon name="ban" />}
          Drop scheme [{dropSchemaName}]
        </Modal.Header>
        <Modal.Content>
          <Input focus error={state.name != dropSchemaName} fluid icon="list" placeholder={`Type ${dropSchemaName} here...`} onChange={e => invalidate({name: e.target.value})}/>
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
              const { server, database } = getUrlParams();
              invalidate({ saving: true });
              const { error } = await post(`/api/v1/schema/drop`, {
                name: dropSchemaName,
                server,
                database
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

export default SchemaDropModal;
