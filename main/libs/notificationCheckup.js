const ms = require('ms')
const Sentry = require('@sentry/node')

let timer
let times = 0

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
    if (times === 0) {
      times = 1
      timer = setTimeout(() => checkup(window), ms('4h'))
    }
  } catch (err) {
    Sentry.captureException(err)
  }
}
