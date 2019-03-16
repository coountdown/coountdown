const isDev = require('electron-is-dev')

module.exports = {
  // eslint-disable-next-line arrow-body-style
  getEnv: (env) => {
    return {
      APP_NAME: 'Coountdown',
      WEB_URL: isDev ? 'http://localhost:3001' : env.REACT_APP_WEB_URL,
      APP_URL: isDev ? 'http://localhost:3000' : env.REACT_APP_APP_URL,
      SENTRY_DNS: isDev
        ? 'https://16a7cc438d5e4184b518932b121748ee@sentry.io/1395662'
        : env.REACT_APP_SENTRY_DNS,
      MIXPANEL_TOKEN: isDev ? 'f9db20426301050e7ba821677b347166' : env.REACT_APP_MIXPANEL,
    }
  },
}
