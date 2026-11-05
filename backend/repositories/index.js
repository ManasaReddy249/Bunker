const env = require('../config/env');

function getRepos() {
  if (env.demoMode) {
    return require('./demo');
  }
  return require('./sql');
}

module.exports = { getRepos };
