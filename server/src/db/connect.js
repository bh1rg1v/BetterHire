const mongoose = require('mongoose');
const config = require('../config');

async function connect() {
  await mongoose.connect(config.mongoUri);
}

function disconnect() {
  return mongoose.disconnect();
}

module.exports = { connect, disconnect };
