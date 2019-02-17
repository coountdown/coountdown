const isDev = require('electron-is-dev')

module.exports = {
  APP_NAME: 'Coountdown',
  WEB_URL: isDev ? 'http://localhost:3001' : 'https://coountdown.com',
  APP_URL: isDev ? 'http://localhost:3000' : 'https://app.coountdown.com',
  SENTRY_DNS: 'https://16a7cc438d5e4184b518932b121748ee@sentry.io/1395662',
  MIXPANEL_TOKEN: 'f9db20426301050e7ba821677b347166',
}
