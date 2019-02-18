const { autoUpdater } = require('electron-updater')
const log = require('electron-log')
const isDev = require('electron-is-dev')
const Sentry = require('@sentry/node')
const mixpanel = require('../libs/mixpanel')

const updateApp = async () => {
  try {
    await autoUpdater.checkForUpdates()
  } catch (err) {
    Sentry.captureException(err)
  }
}

module.exports = app => {
  autoUpdater.logger = log
  autoUpdater.logger.transports.file.level = 'info'
  autoUpdater.logger.transports.file.format = '{h}:{i}:{s}:{ms} {text}'
  autoUpdater.logger.info('Start update process..')

  autoUpdater.on('error', error => {
    console.log(error)
    Sentry.captureException(error)
  })

  autoUpdater.on('update-not-available', () => {
    mixpanel.track(app, 'Update Not Available')
  })

  autoUpdater.on('update-downloaded', ({ version }) => {
    mixpanel.track(app, 'Update Download', { new_version: version })
  })

  if (!isDev) {
    updateApp()
  }
}
