const os = require('os')
const Sentry = require('@sentry/node');
const config = require('../../config')

module.exports = {
  setupSentry: (app) => {
    Sentry.init({ dsn: config.SENTRY_DNS });
    Sentry.configureScope((scope) => {
      // console.log(process.versions.electron)
      // console.log(process.type)
      // console.log(process.versions.chrome)
      // console.log(app.getVersion())
      // console.log(os.platform())
      // console.log(os.release())

      scope.setTag('app_version', app ? app.getVersion() : 'Unknown');
      scope.setTag('electron_version', process.versions.electron);
      scope.setTag('chrome', process.versions.chrome);
      scope.setTag('process', process.type);
      scope.setTag('platform_os', os.platform())
      scope.setTag('platform_release', os.release())
    })
  },
}
