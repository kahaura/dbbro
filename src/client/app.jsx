import React from 'react';
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import TableListPage from 'client/database/table-list';
import DatabaseListPage from 'client/server/database-list';
import TableBrowsePage from 'client/table/browse';

const NoMatch = () => (
    <p>404</p>
)

const App = () => (
    <Router>
        <Switch>
            <Route exact path="/" component={DatabaseListPage} />
            <Route exact path="/database" component={TableListPage} />
            <Route exact path="/table" component={TableBrowsePage} />
            <Route component={NoMatch} />
        </Switch>
    </Router>    
)

export default App;