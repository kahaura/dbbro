import React from "react";
import { Modal, Icon, Button, Input, Message } from "semantic-ui-react";
import { StateHolder, post, getUrlParams } from "client/utils";

const DatabaseCreateModal = ({ onClose, onCreate, open }) => (
  <StateHolder init={{ saving: false, name: "" }} >
    {(state, invalidate) => (
      <Modal open={open} onClose={onClose}>
        <Modal.Header>
          {state.saving ? <Icon loading name="add" /> : <Icon name="add" />}
          Create new database
        </Modal.Header>
        <Modal.Content>
          <Input fluid icon="database" placeholder="Type database name here" onChange={e => invalidate({name: e.target.value})}/>
          {state.error && <Message negative content={state.error}/>}
        </Modal.Content>
        <Modal.Actions>
          <Button negative onClick={onClose}>
            Cancel
          </Button>
          <Button
            positive
            icon="checkmark"
            labelPosition="right"
            content="Create"
            onClick={async () => {
              // Save the changes then close
              const { name } = state;
              const { server } = getUrlParams();
              invalidate({ saving: true });
              const { error } = await post(`/api/v1/database/create`, {
                name,
                server
              });
              invalidate({ saving: false, error });
              if (!error) {
                onCreate();
                onClose();
              }
            }}
          />
        </Modal.Actions>
      </Modal>
    )}
  </StateHolder>
);


export default DatabaseCreateModal;
