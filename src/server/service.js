const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const {logger} = require('./logging')

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())
app.use(methodOverride())
app.use(express.static('dist'));

/*
function logErrors (err, req, res, next) {
  console.error(err.stack)
  next(err)
}

function clientErrorHandler (err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: 'Something failed!' })
  } else {
    next(err)
  }
}

function errorHandler (err, req, res, next) {
  res.status(500)
  res.render('error', { error: err })
}
*/

app.use((req, res, next) => {
  logger.info(req.url)
  next();
});

function ok(data) {
  return {
    result: data != undefined ? data : 'ok'
  };
}

function fail({message, code, exception}) {
  if(exception) {
    return {
      error: exception.message 
        ? exception.message 
        : exception.originalError 
          ? exception.originalError.message 
          : '' + exception
    }
  }
  return {
    error: message,
    code
  };
}

module.exports = {app, ok, fail};
