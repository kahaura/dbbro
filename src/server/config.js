const fs = require('fs');
const path = require('path');

const getConfigFilePath = () => path.join(__dirname, 'config.json');

const raw = fs.readFileSync(getConfigFilePath());
const map = JSON.parse(raw);

const settings = {
  ...map,
  save: function() {
    const data = {...this}
    delete data.save
    const buffer = JSON.stringify(data, null, 4)
    console.debug(buffer)
    fs.writeFileSync(getConfigFilePath(), buffer)
    }
}

module.exports = {settings};


