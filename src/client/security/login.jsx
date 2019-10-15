import React from 'react';
import cookie from 'react-cookies'
import { Redirect } from 'react-router-dom'
import { Button, Form, Grid, Header, Icon, Message, Segment } from 'semantic-ui-react';

import { StateHolder, Proxy, Switch, Case } from 'client/utils';

const LoginForm = ({state, invalidate}) => (
  <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
    <Grid.Column style={{ maxWidth: 450 }}>
      <Form size='large'>
        <Segment vertical>
          <Header as='h2' textAlign='left'>
            <Icon name='database' />
            <Header.Content>
              DBbro
              <Header.Subheader>Browse your SQL server and manipulate data.</Header.Subheader>
            </Header.Content>
          </Header>
          <Form.Input 
            fluid 
            icon='user' 
            iconPosition='left' 
            placeholder='Username' 
            onChange={(e) => invalidate({username: e.target.value})}
            />
          <Form.Input
            fluid
            icon='lock'
            iconPosition='left'
            placeholder='Password'
            type='password'
            onChange={(e) => invalidate({password: e.target.value})}
          />
          <Button 
            color='teal' 
            fluid 
            size='large' 
            onClick={async () => {
              if(state.username && state.password) {
                const proxy = new Proxy()
                const url = `/api/v1/security/${state.username}/login`
                const {result, error} = await proxy.post(url, {password: state.password})
                if(error) {
                  invalidate({error})
                } else {
                  console.debug(result)
                  cookie.save('token', result)
                  invalidate({token: result})
                }
              } else {
                invalidate({error: 'User and password cannot be empty.'})
              }
            }}>
            Login
          </Button>
        </Segment>
        {state.error && 
          <Message 
            negative 
            style={{textAlign: 'left'}}
            content={state.error} />
        }
      </Form>
    </Grid.Column>
  </Grid>
)

const LoginPage = () => (
  <StateHolder init={{error: null, username: '', password: ''}}>
    {(state, invalidate) => (
      <Switch>
        <Case when={state.token}>
          <Redirect to='/'/>
        </Case>
        <Case when={!state.token}>
          <LoginForm state={state} invalidate={invalidate} />
        </Case>
      </Switch>
    )}
  </StateHolder>
)
export default LoginPage;