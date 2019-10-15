import React, { createRef } from "react";
import { Modal, Table, Icon, Message } from "semantic-ui-react";
import { post, getUrlParams, StateHolder, getNewId } from "client/utils";

const ace = require("brace");
require("brace/mode/sql");
require("brace/ext/language_tools");
require("brace/snippets/sql");
require("brace/snippets/text");

export class Editor extends React.Component {
  id = `sql-code-editor-${getNewId()}`;
  textareaRef = createRef();

  render() {
    return (
      <div
        style={{ height: "100%", width: "100%" }}
        className="sql-editor"
        id={this.id}
      />
    );
  }

  componentDidMount() {
    const editor = ace.edit(this.id);
    editor.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true
    });
    const session = editor.getSession();
    const document = session.getDocument();
    session.setMode("ace/mode/sql");
    session.on("change", () => {
      const { onCodeChange } = this.props;
      if (onCodeChange) {
        const lines = document.getAllLines();
        onCodeChange(lines.join("\n"));
      }
    });
    //editor.setTheme('ace/theme/ambiance');
  }
}

const ResultTable = ({ records }) => {
  const columns = Object.keys(records[0]);
  const cells = columns.map((column, i) => (
    <Table.HeaderCell key={i}>{column}</Table.HeaderCell>
  ));
  const rows = records.map((r, ri) => {
    const body = columns.map((c, ci) => (
      <Table.Cell key={ci}>{r[c]}</Table.Cell>
    ));
    return <Table.Row key={ri}>{body}</Table.Row>;
  });
  return (
    <Table celled>
      <Table.Header>
        <Table.Row>{cells}</Table.Row>
      </Table.Header>
      <Table.Body>{rows}</Table.Body>
    </Table>
  );
};

const ResultRenderer = ({ result }) => {
  const table =
    result && result.recordset && result.recordset.length > 0 ? (
      <ResultTable records={result.recordset} />
    ) : null;
  return table;
};

const SQLEditor = ({ onClose, open }) => (
  <StateHolder init={{ code: "", result: null, showSaveModal: false }}>
    {(state, invalidate) => {
      const { error, result } = state;
      return (
        <Modal
          open={open}
          onClose={onClose}
          className="editor-modal"
          style={{ width: "90%", height: "90%" }}
        >
          <Modal.Header>
            <div className="editor-actions">
              <Icon
                color="red"
                link
                name="play"
                onClick={async () => {
                  const code = state.code.replace("\n", "").trim();
                  if (code) {
                    const { server, database } = getUrlParams();
                    const { result, error } = await post(
                      "/api/v1/database/execute",
                      {
                        server,
                        database,
                        query: code
                      }
                    );
                    invalidate({ result, error });
                  }
                }}
              />
              <Icon
                color="green"
                link
                name="save"
                onClick={() => invalidate({ showSaveModal: true })}
              />
              <Icon
                color="yellow"
                link
                name="book"
                onClick={onClose}
              />
            </div>
            <div style={{ textAlign: "right" }}>
              <Icon link name="close" onClick={onClose} />
            </div>
          </Modal.Header>
          <Modal.Content>
            <div className="editor-edit">
              <Editor onCodeChange={code => invalidate({ code })} />
            </div>
            <div className="editor-error">
              {error && <Message negative content={error} />}
            </div>
            <div className="editor-result">
              <ResultRenderer result={result} />
            </div>
          </Modal.Content>
        </Modal>
      );
    }}
  </StateHolder>
);

export default SQLEditor;
