import React, { createRef } from "react";
import { Table, Icon } from "semantic-ui-react";

import { post, getUrlParams, Storage } from "client/utils";

const ResultList = ({ record }) => {
  const columns = Object.keys(record);
  const rows = columns.map((c, i) => (
    <Table.Row key={i}>
      <Table.Cell>{c}</Table.Cell>
      <Table.Cell>{record[c]}</Table.Cell>
    </Table.Row>
  ));
  return (
    <Table
      style={{ paddingLeft: "8px" }}
      basic="very"
      celled
      collapsing
      inverted
    >
      <Table.Body>{rows}</Table.Body>
    </Table>
  );
};

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
    <Table
      style={{ paddingLeft: "8px" }}
      basic="very"
      celled
      collapsing
      inverted
    >
      <Table.Header>
        <Table.Row>{cells}</Table.Row>
      </Table.Header>
      <Table.Body>{rows}</Table.Body>
    </Table>
  );
};

export class ConsolePrompt extends React.Component {
  state = {
    value: "",
    historyIndex: -1,
    lastValue: ""
  };

  render() {
    const { prompt, input } = this.props;
    const { value } = this.state;
    return (
      <div className="console-prompt">
        <table>
          <tbody>
            <tr>
              <td className="console-prompt-text">{prompt}</td>
              {input ? (
                <td width="100%" className="console-prompt-pushed">
                  {input}
                </td>
              ) : (
                <td width="100%" className="console-prompt-input">
                  <input
                    autoFocus
                    value={value}
                    onChange={e =>
                      this.setState({
                        value: e.target.value,
                        lastValue: e.target.value
                      })
                    }
                    onKeyDown={async e => await this.onKeyDown(e)}
                  />
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  async onKeyDown(e) {
    const handlers = {
      Enter: async () => await this.handleCommandExecute(),
      ArrowUp: async () => await this.replaceWithPrevHistory(),
      ArrowDown: async () => await this.replaceWithNextHistory()
    };
    const handler = handlers[e.key];
    if (handler) {
      await handler();
    }
  }

  async replaceWithPrevHistory() {
    const stack = await this.loadHistory();
    var { historyIndex } = this.state;
    historyIndex = historyIndex < 0 ? stack.length - 1 : historyIndex;
    if (historyIndex >= 0) {
      this.setState({
        historyIndex: historyIndex - 1,
        value: stack[historyIndex]
      });
    }
  }

  async replaceWithNextHistory() {
    const stack = await this.loadHistory();
    var { historyIndex, lastValue } = this.state;
    historyIndex = historyIndex < 0 ? 0 : historyIndex;
    if (historyIndex >= 0 && historyIndex < stack.length - 1) {
      this.setState({
        historyIndex: historyIndex + 1,
        value: stack[historyIndex + 1]
      });
    } else if (historyIndex >= stack.length - 1) {
      this.setState({ value: lastValue });
    }
  }

  async pushToHistory(value) {
    // Update history
    if (value.trim()) {
      const storage = new Storage("console-history", { stack: [] });
      const { stack } = storage.load();
      stack.push(value);
      storage.update({ stack });
    }
  }

  async loadHistory() {
    const storage = new Storage("console-history", { stack: [] });
    const { stack } = storage.load();
    const result = [];
    stack.forEach(i => {
      const old = result.find(o => o == i);
      if (!old) {
        result.push(i);
      }
    });
    return result;
  }

  async handleCommandExecute() {
    const { onCommand } = this.props;
    const { value } = this.state;
    // Update state of prompt first
    this.setState({ value: "" });

    // Execute command
    await onCommand(value);
    await this.pushToHistory(value);
  }
}

export class Console extends React.Component {
  containerRef = createRef()
  state = {
    stack: [],
    running: false
  };

  render() {
    const { stack, running } = this.state;
    const { prompt } = this.props;
    const pushed = stack.map((stack, i) => {
      if (stack.input) {
        return <ConsolePrompt key={i} prompt={prompt} input={stack.input} />;
      } else if (stack.result) {
        return this.renderResult(stack, i);
      } else if (stack.error) {
        return <h5 key={i}>{stack.error}</h5>;
      }
    });
    return (
      <div className="console">
        <div ref={this.containerRef} className="console-container">
          {pushed}
          {running &&
            <Icon loading color="grey" name="add" />
          }
          {!running && (
            <ConsolePrompt
              prompt={prompt}
              onCommand={async input => await this.execute(input)}
            />
          )}
        </div>
      </div>
    );
  }

  renderResult(stack, key) {
    const { result } = stack;
    const { recordset } = result;
    if (recordset && recordset.length > 0) {
      if (recordset.length == 1) {
        return <ResultList key={key} record={recordset[0]} />;
      } else {
        return <ResultTable key={key} records={recordset} />;
      }
    }
    return <p>Done!</p>;
  }

  async execute(input) {
    const { stack } = this.state;
    if (input.trim()) {
      stack.push({ input });
      this.setState({ stack, running: true, input: "" });
      const { server, database } = getUrlParams();
      const { result, error } = await post("/api/v1/database/execute", {
        server,
        database,
        query: input
      });
      stack.push({ result, error });
      this.setState({ stack, running: false });
    } else {
      stack.push({ input: " " });
      this.setState({ stack, input: "" });
    }
  }
}
