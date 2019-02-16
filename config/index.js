const isDev = require('electron-is-dev')

module.exports = {
  frontendUrl: isDev ? 'http://localhost:3000' : 'https://app.coountdown.com',
}
