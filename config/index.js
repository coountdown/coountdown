const isDev = require('electron-is-dev')

module.exports = {
  APP_NAME: 'Coountdown',
  FRONTEND_URL: isDev ? 'http://localhost:3000' : 'https://app.coountdown.com',
  SENTRY_DNS: 'https://16a7cc438d5e4184b518932b121748ee@sentry.io/1395662',
}
