/* eslint-disable react/prop-types */
import React from 'react';
import { HashRouter as Router, Route, Switch, Redirect} from "react-router-dom";
//import TableListPage from 'client/schema/table-list';
//import DatabaseListPage from 'client/database/schema-list';
//import TableBrowsePage from 'client/table/browse';
import ServerListPage from 'client/server/server-list'
import DatabaseListPage from 'client/server/database-list'
import LoginPage from 'client/security/login';
import SchemaListPage from 'client/database/schema-list';
import TableListPage from 'client/schema/table-list';
import TableBrowsePage from 'client/table/browse';
import cookie from 'react-cookies'
import { Query, When } from 'client/utils';

const NoMatch = () => (
    <p>404</p>
)

Window.rxcookie = cookie;

const Site = ({authenticated}) => {
    return (
        <Router>
            <Switch>
                <Route exact path="/" component={ServerListPage} />
                <Route exact path="/database" component={DatabaseListPage} />
                <Route exact path="/schema" component={SchemaListPage} />
                <Route exact path="/table" component={TableListPage} />
                <Route exact path="/browse" component={TableBrowsePage} />
                <Route exact path="/login" component={LoginPage} />
                <Route component={NoMatch} />
                <When condition={!authenticated}>
                    <Redirect to='/login' />
                </When>
            </Switch>
        </Router>
    );
}

/*
    <Route exact path="/database" component={TableListPage} />
    <Route exact path="/table" component={TableBrowsePage} />
*/

const App = () => (
    <Query 
        path={`/api/v1/security/${cookie.load('token')}/authenticate`}>
        {({error, result}) => {
            return <Site authenticated={!error} user={result}/>
        }}
    </Query>
)

export default App;