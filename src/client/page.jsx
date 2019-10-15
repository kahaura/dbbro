/* eslint-disable react/prop-types */
import React from "react";
import { Link } from "react-router-dom";
import { Segment, Header, Icon } from "semantic-ui-react";
import { getUrlParams } from "client/utils";
import SQLTerminal from "client/sql/terminal";
import SQLEditor from "client/sql/editor";

export default class Page extends React.Component {
  state = {
    showTerminal: false,
    showCodeEditor: false
  };
  render() {
    const { children } = this.props;
    const { showTerminal, showCodeEditor } = this.state;
    console.debug(showTerminal);
    return (
      <div className='page'>
        <SQLTerminal
          open={showTerminal}
          onClose={() => this.setState({ showTerminal: false })}
        />
        <SQLEditor
          open={showCodeEditor}
          onClose={() => this.setState({ showCodeEditor: false })}
        />
        <Segment basic clearing>
          <Header floated="left">
            <Link to='/'>
            <Icon name="columns"/>
            <Header.Content>
              DBbro
              <Header.Subheader>Browse database and edit data</Header.Subheader>
            </Header.Content>
            </Link>
          </Header>
          <Header as="h5" floated="right">
            {getUrlParams().server && (
              <Icon
                link
                name="terminal"
                onClick={() => this.setState({ showTerminal: true })}
              />
            )}
            {getUrlParams().server && (
              <Icon
                link
                name="code"
                onClick={() => this.setState({ showCodeEditor: true })}
              />
            )}
          </Header>
        </Segment>
        <Segment basic>{children}</Segment>
      </div>
    );
  }
}
