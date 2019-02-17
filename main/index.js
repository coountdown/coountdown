const {
  app, BrowserWindow, Tray, ipcMain, globalShortcut,
} = require('electron')
const { resolve: resolveRootPath } = require('app-root-path')
const Sentry = require('@sentry/node');
const fixPath = require('fix-path')
const isDev = require('electron-is-dev')
const electronUtil = require('electron-util')
const moment = require('moment')

const { setupSentry } = require('./libs/sentry')
const mixpanel = require('./libs/mixpanel')
const menubar = require('./libs/menubar')

// Setup env before require config file
require('dotenv').config()
const config = require('../config')

// Fix path process
fixPath()

// Announcement for development
console.log(`On ${isDev ? 'development' : 'production'} mode.`)
console.log(`Frontend: ${config.FRONTEND_URL}`)

// Constants
let onlineStatusWindow
let tray
let isQuit = false
const appLaunchTime = moment()

setupSentry(app)
app.setName(config.APP_NAME)

// Hide dock icon (In production mode, it's setup on package.json. [key: LSUIElement])
if (isDev && electronUtil.is.macos) {
  app.dock.hide()
}

// Process Cycle
app.on('ready', async () => {
  // Checking internet connection
  onlineStatusWindow = new BrowserWindow({
    width: 0,
    height: 0,
    show: false,
  })

  onlineStatusWindow.loadURL(
    `file://${resolveRootPath('./main/static/pages/online-status.html')}`,
  )

  ipcMain.on('online-status-changed', (event, status) => {
    console.log(`connection: ${status.toUpperCase()}`)
    process.env.CONNECTION = status
  })

  electronUtil.enforceMacOSAppLocation()

  mixpanel.track(app, 'Launch App')

  try {
    tray = new Tray(resolveRootPath('./main/static/tray/iconTemplate.png'))
    tray.setToolTip(config.APP_NAME)
  } catch (err) {
    Sentry.captureException(err)
  }

  // Must have Tray
  menubar(tray, app)

  console.log('App Ready')
  console.log('Launch on', appLaunchTime.format('LLL'))
})

app.on('before-quit', (event) => {
  if (!isQuit && process.env.CONNECTION === 'online') {
    const appQuitTime = moment();
    const durationTime = appQuitTime.diff(appLaunchTime)
    const sessionTimeMinutes = moment.duration(durationTime).asMinutes()

    event.preventDefault()
    isQuit = true
    mixpanel.track(
      app,
      'Quit App',
      { session_time_minutes: sessionTimeMinutes },
      () => app.quit(),
    )
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
