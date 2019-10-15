const uuidv1 = require('uuid')
const express = require('express')
const {settings} = require('./config')
const {app, ok, fail} = require('./service')

const tokens = []

function login(username, password) {
  const token = uuidv1()
  const user = settings.users.find(e => e.name == username)
  console.dir(settings.users)
  console.debug(`User [${username}] found.`)
  if(user && user.password == password) {
    tokens.push({token, user})
    console.debug(`User [${username}] logged in.`)
    return token
  }
  console.debug('Username or password is wrong.')
  return null
}

function authenticate(token) {
  const ticket = tokens.find(e => e.token == token);
  return ticket ? ticket : null;
}

const router = express.Router();

router.post('/:username/login', async (req, res) => {
  const { username } = req.params;
  const { password } = req.body;
  const token = login(username, password);
  const result = token == null ? fail('User or password is wrong!') : ok(token);
  console.dir(result);
  res.send(result);
});

router.get('/:token/authenticate', async (req, res) => {
  const { token } = req.params;
  const data = authenticate(token);
  if (data == null) {
    //res.send(ok({name: 'admin'}));
    res.status(500).send(fail(`Token [${token}] is not valid.`));
  } else {
    res.send(ok(data.user));
  }
});

router.get('/test', async (req, res) => {
  res.send(ok('OK'));
});

app.use('/api/v1/security', router);

module.exports = {login, authenticate};