import React from "react";
import {
  Modal,
  Icon,
  Button,
  Dropdown,
  Form,
  Checkbox,
  Input,
  Header,
  Message
} from "semantic-ui-react";
import { StateHolder, Proxy } from "client/utils";

const SQLContainer = ({ state, invalidate }) => (
  <Form>
    <Form.Field>
      <label>Name</label>
      <Input
        placeholder="Name your sarver here"
        onChange={e => {
          invalidate({ name: e.target.value });
        }}
      />
    </Form.Field>
    <Form.Group widths="equal">
      <Form.Field>
        <label>Host</label>
        <Input
          placeholder="Host name or IP of database server"
          onChange={e => {
            const { data } = state;
            data.server = e.target.value;
            invalidate({ data });
          }}
        />
      </Form.Field>
      <Form.Field>
        <label>Port</label>
        <Input
          placeholder="1433"
          onChange={e => {
            const { data } = state;
            data.port = e.target.value;
            invalidate({ data });
          }}
        />
      </Form.Field>
    </Form.Group>
    <Form.Group widths="equal">
      <Form.Field>
        <label>Database user</label>
        <Input
          placeholder="Username"
          onChange={e => {
            const { data } = state;
            data.user = e.target.value;
            invalidate({ data });
          }}
        />
      </Form.Field>
      <Form.Field>
        <label>Password</label>
        <Input
          placeholder="Password"
          type="password"
          onChange={e => {
            const { data } = state;
            data.password = e.target.value;
            invalidate({ data });
          }}
        />
      </Form.Field>
    </Form.Group>
    <Form.Field>
      <Checkbox
        label="Encrypt connection"
        onChange={e => {
          const { data } = state;
          data.options.encrypt = !data.options.encrypt;
          invalidate({ data });
        }}
      />
    </Form.Field>
    <Form.Field>
      {state.error && (
        <Header as="h5" color="red">
          <Icon loading name="ban" />
          {state.error}
        </Header>
      )}
    </Form.Field>
  </Form>
);

const databaseContainers = [
  {
    key: "mssql",
    value: SQLContainer
  }
];

const databaseTypes = [
  {
    key: "mssql",
    text: "Microsoft SQL Server",
    value: "mssql"
    //image: { avatar: true, src: '/images/avatar/mssql.png' },
  },
  /*
  {
    key: "postgres",
    text: "Postgres SQL",
    value: "postgres"
    //image: { avatar: true, src: '/images/avatar/postgres.png' },
  },
  {
    key: "mysql",
    text: "MySQL",
    value: "mysql"
    //image: { avatar: true, src: '/images/avatar/mysql.png' },
  }
  */
];

const DatabaseContainer = ({ state, invalidate }) => {
  const data = databaseContainers.find(e => e.key == state.type);
  return data && data.value ? (
    <data.value state={state} invalidate={invalidate} />
  ) : null;
};

const DatabaseTypeSelect = ({ state, invalidate }) => (
  <Dropdown
    placeholder="Select Database Type"
    fluid
    selection
    options={databaseTypes}
    defaultValue={state.type}
    onChange={(e, { value }) => invalidate({ type: value })}
  />
);

const DatabaseCreateModal = ({ onClose, onCreate, open }) => (
  <StateHolder
    init={{
      saving: false,
      name: "",
      type: null,
      data: { options: {} },
      error: null
    }}
  >
    {(state, invalidate) => (
      <Modal open={open} onClose={onClose}>
        <Modal.Header>
          {state.saving ? <Icon loading name="add" /> : <Icon name="add" />}
          Create new server
        </Modal.Header>
        <Modal.Content>
          <DatabaseTypeSelect state={state} invalidate={invalidate} />
        </Modal.Content>
        <Modal.Content style={{ minHeight: "320px" }}>
          <DatabaseContainer state={state} invalidate={invalidate} />
          {state.error && <Message negative content={state.error}/>}
        </Modal.Content>
        <Modal.Actions>
          <Button negative onClick={onClose}>
            No
          </Button>
          <Button
            positive
            icon="checkmark"
            labelPosition="right"
            content="Yes"
            onClick={async () => {
              // Save the changes then close
              invalidate({ saving: true });
              const { error } = await new Proxy().post(
                `/api/v1/server/create`,
                { name: state.name, type: state.type, config: state.data }
              );
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
