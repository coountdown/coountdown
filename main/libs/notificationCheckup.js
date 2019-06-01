const ms = require('ms')
const Sentry = require('@sentry/node')

let timer

const checkup = async (window) => {
  try {
    clearTimeout(timer)
    timer = setTimeout(() => checkup(window), ms('4h'))
    window.webContents.send('checkNotification')
  } catch (err) {
    Sentry.captureException(err)
  }
}

module.exports = (window) => {
  try {
    timer = setTimeout(() => checkup(window), ms('4h'))
  } catch (err) {
    Sentry.captureException(err)
  }
}
