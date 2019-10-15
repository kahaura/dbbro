/* eslint-disable react/prop-types */
/* eslint-disable no-param-reassign */
import React from "react";
import { Segment, Modal, Icon } from "semantic-ui-react";

export class Proxy {
  constructor() {
    this.base = window.location.origin;
  }

  makeUrl(path) {
    return this.base + path;
  }

  async extract(response) {
    try {
      const json = await response.json();
      const error = json.error ? json.error : null;
      const result = json.result ? json.result : null;
      console.debug({ url: response.url, error, result });
      return { error, result };
    } catch (e) {
      return { error: response.text() };
    }
  }

  async get(path, params) {
    params = params || {};
    const urlParams = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join("&");
    const url = urlParams
      ? `${this.makeUrl(path)}?${urlParams}`
      : this.makeUrl(path);
    console.debug("GET-> ", url);

    const response = await fetch(url);
    return await this.extract(response);
  }

  async post(path, data) {
    const url = this.makeUrl(path);
    console.debug("POST-> ", url);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
        // "Content-Type": "application/x-www-form-urlencoded",
      },
      body: JSON.stringify(data)
    });
    return await this.extract(response);
  }
}

export const post = async (path, data) => await new Proxy().post(path, data);
export const get = async (path, params) => await new Proxy().get(path, params);

export const Case = props => <React.Fragment>{props.children}</React.Fragment>;

export const Default = props => (
  <React.Fragment>{props.children}</React.Fragment>
);

export const Switch = props => {
  let dfl;
  let meet;
  let content;
  props.children.forEach(child => {
    if (child.type == Default) {
      dfl = child;
    } else if (child.props.when) {
      meet = child;
    }
  });
  content = meet || dfl;
  return <React.Fragment>{content}</React.Fragment>;
};

export const When = ({ children, condition }) => {
  if (condition) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return null;
};

export class StateHolder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ...this.props.init
    };
    this.local = {
      ...this.props.local
    };
  }

  render() {
    const invalidate = data =>
      data ? this.setState(data) : this.forceUpdate();
    return this.props.children(this.state, invalidate, this.local);
  }

  componentDidMount() {
    if (this.props.onComponentMounted) {
      const state = this.state;
      const local = this.local;
      const invalidate = data =>
        data ? this.setState(data) : this.forceUpdate();
      this.props.onComponentMounted({ state, invalidate, local });
    }
  }
}

export class Query extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      response: null
    };
  }

  renderLoading = () => (
    <Switch>
      <Case when={this.props.loading}>{this.props.loading}</Case>
      <Default>
        <Segment basic loading padded="very" />
      </Default>
    </Switch>
  );

  renderError = () => (
    <Switch>
      <Case when={this.props.error}>{this.props.error}</Case>
      <Default>
        <Modal size="mini" open={true}>
          <Modal.Header>
            Error happend!
            <Icon name="ban" />
          </Modal.Header>
          <Modal.Content>
            <p>{this.state.response.error}</p>
          </Modal.Content>
        </Modal>
      </Default>
    </Switch>
  );

  render() {
    const { response } = this.state;
    if (response) {
      const { error, result } = response;
      if (error && this.props.handleError) {
        return this.renderError();
      }
      return this.props.children({ error, result });
    }
    return this.renderLoading();
  }

  async componentDidMount() {
    const proxy = new Proxy();
    const response = await proxy.get(this.props.path, this.props.params);
    this.setState({ response });
  }
}

export const getUrlParams = key => {
  const href = decodeURIComponent(window.location.href);
  const props = href.search("\\?") > 1 ? href.split("?")[1].split("&") : [];
  const all = props.map(e => e.split("="));
  const result = Object.fromEntries(new Map(all));
  return key ? result[key] : result;
};

export class Storage {
  constructor(key, initData) {
    this.key = key;
    const data = this.load();
    initData = initData ? initData : {};
    if (!data) {
      console.debug(initData);
      this.save(initData);
    }
  }

  save(data) {
    const stream = JSON.stringify(data);
    window.localStorage.setItem(this.key, stream);
  }

  load() {
    const data = window.localStorage.getItem(this.key);
    if (data) {
      const result = JSON.parse(data);
      return result;
    }
    return null;
  }

  update(data) {
    const old = this.load();
    const current = {
      ...old,
      ...data
    };
    this.save(current);
    return current;
  }

  clear() {
    window.localStorage.removeItem(this.key);
  }
}

export async function timeout(seconds) {
  // eslint-disable-next-line no-undef
  return new Promise(resolve => setTimeout(resolve, 1000 * seconds));
}

const makeIdGenerator = start => {
  var id = start;

  const increase = () => {
    id += 1;
    return id;
  };

  return increase;
};

export const getNewId = makeIdGenerator(0);

console.debug(getNewId(), getNewId(), getNewId())