const { autoUpdater } = require('electron-updater')
const log = require('electron-log')
const isDev = require('electron-is-dev')
const Sentry = require('@sentry/node')
const semver = require('semver')
const mixpanel = require('../libs/mixpanel')
const notification = require('../libs/notification')

const updateApp = async () => {
  if (process.env.CONNECTION === 'offline') {
    setTimeout(updateApp, 3600000)
    return
  }

  try {
    await autoUpdater.checkForUpdates()
  } catch (err) {
    Sentry.captureException(err)
  }
}

module.exports = (app) => {
  const isCanary = app.getVersion().includes('canary')
  if (isCanary) {
    console.log('canary version')
    return
  }

  autoUpdater.logger = log
  autoUpdater.logger.transports.file.level = 'info'
  autoUpdater.logger.transports.file.format = '{h}:{i}:{s}:{ms} {text}'
  autoUpdater.logger.info('Intial update..')

  autoUpdater.on('error', (error) => {
    Sentry.captureException(error)
  })

  autoUpdater.on('update-downloaded', ({ version }) => {
    const onDeviceVersion = app.getVersion()
    const versionDiffType = semver.diff(version, onDeviceVersion)

    if (versionDiffType !== 'path') {
      notification(app.getName(), 'Update available', true, () => {
        autoUpdater.quitAndInstall()
      })
    }

    mixpanel.track(app, 'Update Download')
  })

  if (!isDev) {
    updateApp()
  }
}
