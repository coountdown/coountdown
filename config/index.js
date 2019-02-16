const isDev = require('electron-is-dev')

module.exports = {
  APP_NAME: 'Coountdown',
  FRONTEND_URL: isDev ? 'http://localhost:3000' : 'https://app.coountdown.com',
}
