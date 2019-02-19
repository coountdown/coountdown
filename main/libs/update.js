const { autoUpdater } = require('electron-updater')
const log = require('electron-log')
const isDev = require('electron-is-dev')
const Sentry = require('@sentry/node')
const semver = require('semver')
const mixpanel = require('../libs/mixpanel')
const notification = require('../libs/notification')

const updateApp = async () => {
  try {
    await autoUpdater.checkForUpdates()
  } catch (err) {
    Sentry.captureException(err)
  }
}

module.exports = (app) => {
  autoUpdater.logger = log
  autoUpdater.logger.transports.file.level = 'info'
  autoUpdater.logger.transports.file.format = '{h}:{i}:{s}:{ms} {text}'
  autoUpdater.logger.info('Start update process..')

  autoUpdater.on('error', (error) => {
    Sentry.captureException(error)
  })

  autoUpdater.on('update-not-available', () => {
    mixpanel.track(app, 'Update Not Available')
  })

  autoUpdater.on('update-downloaded', ({ newVersion }) => {
    const onDeviceVersion = app.getVersion()
    const versionDiffType = semver.diff(newVersion, onDeviceVersion)

    if (versionDiffType !== 'path') {
      notification(app.getName(), 'Update available', () => {
        autoUpdater.quitAndInstall()
      })
      mixpanel.track(app, 'Major Update', { new_version: newVersion })
    }

    mixpanel.track(app, 'Update Download', { new_version: newVersion })
  })

  if (!isDev) {
    updateApp()
  }
}
