const ms = require('ms')
const Sentry = require('@sentry/node')

const checkup = async (window) => {
  try {
    setTimeout(() => checkup(window), ms('4h'))
    window.webContents.send('checkNotification')
  } catch (err) {
    Sentry.captureException(err)
  }
}

module.exports = (window) => {
  try {
    setTimeout(() => checkup(window), ms('4h'))
  } catch (err) {
    Sentry.captureException(err)
  }
}
