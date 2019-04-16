import React from 'react'
import { Segment } from 'semantic-ui-react'

export class Proxy {
    constructor() {
        this.base = 'http://localhost:8080'
    }

    makeUrl(path) {
        return this.base + path
    }

    async get(path, params) {
        params = params ? params : {}
        const urlParams = Object.keys(params).map(key => `${key}=${params[key]}`).join('&')
        const url = urlParams ? `${this.makeUrl(path)}?${encodeURIComponent(urlParams)}` : this.makeUrl(path)
        console.debug('GET-> ', url);
        const result = await fetch(url)
        return result
    }

    async post(path, data) {
        const url = this.makeUrl(path);
        console.debug('POST-> ', url);
        const result = await fetch(url, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                // "Content-Type": "application/x-www-form-urlencoded",
            },
            body: JSON.stringify(data)
        })
        return result;
    }
}

export const Case = (props) => (
    <React.Fragment>
        {props.children}
    </React.Fragment>
)

export const Default = (props) => (
    <React.Fragment>
        {props.children}
    </React.Fragment>
)

export const Switch = (props) => {
    var dfl, meet, content
    props.children.forEach((child) => {
        if(child.type == Default) {
            dfl = child
        }
        else if(child.props.when) {
            meet = child
        }
    })
    content = meet ? meet : dfl
    return (
        <React.Fragment>
            {content}
        </React.Fragment>
    )
}

export class StateHolder extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            ...this.props.init
        }
        this.local = {

        }
    }

    render() {
        const invalidate = (data) => data ? this.setState(data) : this.forceUpdate()
        return this.props.children(this.state, invalidate, this.local)
    }
}

export class Query extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            results: null,
        }
    }

    render() {
        const loading = (
            <Switch>
                <Case when={this.props.loading}>
                    {this.props.loading}
                </Case>
                <Default>
                    <Segment basic loading padded='very'></Segment>
                </Default>
            </Switch>
        )
        return this.state.results != null ? this.props.children(this.state.results) : loading
    }

    async componentDidMount() {
        const proxy = new Proxy()
        const results = await proxy.get(this.props.path, this.props.params)
        this.setState({results: await results.json()})
    }
}

export const getUrlParams = (key) => {
    const href = decodeURIComponent(window.location.href)
    const props = href.search('\\?') > 1 ? href.split('?')[1].split('&') : []
    const all = props.map(e => e.split('='))
    const result = Object.fromEntries(new Map(all))
    return key ? result[key] : result
}
