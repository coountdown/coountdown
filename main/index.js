const {
  app, BrowserWindow, Tray, ipcMain, globalShortcut, Notification,
} = require('electron')
const { resolve: resolveRootPath } = require('app-root-path')
const Sentry = require('@sentry/node')
const fixPath = require('fix-path')
const isDev = require('electron-is-dev')
const electronUtil = require('electron-util')
const { machineId } = require('node-machine-id')
const moment = require('moment')
const firstRun = require('first-run')

const { setupSentry } = require('./libs/sentry')
const updater = require('./libs/update')
const menubarLib = require('./libs/menubar')
const trayMenu = require('./libs/trayMenu')
const store = require('./libs/store')
const mixpanel = require('./libs/mixpanel')

const notificationCheckup = require('./libs/notificationCheckup')

// Setup env before require config file
// eslint-disable-next-line import/order
require('dotenv').config()
const config = require('../config')

// Fix path process
fixPath()

// Announcement for development
console.log(`On ${isDev ? 'development' : 'production'} mode.`)
console.log(`WEB: ${config.WEB_URL}`)
console.log(`APP: ${config.APP_URL}`)
console.log('Verison: ', app.getVersion())

// Constants
let onlineStatusWindow
let twitterLoginWindow
let tray
let isQuit = false
let loggedIn = false
let alreadyGetUser = false
const appLaunchTime = moment()

setupSentry(app)
store.setupNoti()
app.setName(config.APP_NAME)

// Hide dock icon (In production mode, it's setup on package.json. [key: LSUIElement])
if (isDev && electronUtil.is.macos) {
  app.dock.hide()
}

if (firstRun()) {
  app.setLoginItemSettings({ openAtLogin: true })
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
}

// Process Cycle
app.on('ready', async () => {
  // Checking internet connection
  onlineStatusWindow = new BrowserWindow({
    width: 0,
    height: 0,
    show: false,
  })

  onlineStatusWindow.loadURL(`file://${resolveRootPath('./main/static/pages/online-status.html')}`)

  // Update internet connection
  ipcMain.on('online-status-changed', (event, status) => {
    console.log(`connection: ${status.toUpperCase()}`)
    process.env.CONNECTION = status
  })

  electronUtil.enforceMacOSAppLocation()
  updater(app)
  mixpanel.track(app, 'Launch App')

  try {
    tray = new Tray(resolveRootPath('./main/static/tray/iconTemplate.png'))
    tray.setToolTip(config.APP_NAME)
  } catch (err) {
    Sentry.captureException(err)
  }

  // Must have Tray
  const menubar = menubarLib(tray, app)

  // send after did-finish-load
  menubar.window.webContents.on('did-finish-load', async () => {
    const currentMachineId = await machineId()
    menubar.window.webContents.send('start', { id: currentMachineId })
    notificationCheckup(menubar.window)
  })

  const onTrayRightClick = (event) => {
    // Toggle window
    if (menubar.window.isVisible()) {
      menubar.window.hide()
      return
    }

    event.preventDefault()
    tray.popUpContextMenu(trayMenu.getDefault(menubar.window, loggedIn, app))
    tray.setHighlightMode('selection')
  }

  const onTrayClick = (event) => {
    menubar.window.reload()
    if (event.ctrlKey) {
      onTrayRightClick(event)
    }
  }

  tray.on('click', onTrayClick)
  tray.on('right-click', onTrayRightClick)

  ipcMain.on('logout-success', () => {
    alreadyGetUser = false
  })

  ipcMain.on('show-menu', () => {
    trayMenu.getDefault(menubar.window, loggedIn, app).popup(tray.window)
  })

  ipcMain.on('loggedIn', (event, args) => {
    loggedIn = args.status
    if (args.loggedIn && args.status && !alreadyGetUser) {
      mixpanel.addUserId(args.loggedIn)
      alreadyGetUser = true
    }
  })

  ipcMain.on('open-twitter-window', (event, args) => {
    if (twitterLoginWindow) {
      twitterLoginWindow.show()
      return
    }

    twitterLoginWindow = new BrowserWindow({
      width: 1200,
      height: 500,
      webPreferences: {
        devTools: isDev,
      },
    })

    twitterLoginWindow.on('closed', () => {
      twitterLoginWindow = null
    })

    twitterLoginWindow.loadURL(args.link)
  })

  ipcMain.on('login-success', () => {
    menubar.window.loadURL(config.APP_URL)
    try {
      twitterLoginWindow.destroy()
      twitterLoginWindow = null
    } catch (err) {
      Sentry.captureException(err)
    }
    menubar.window.show()
  })

  ipcMain.on('notiNow', (event, args) => {
    try {
      const haveNoti = store.get('noti')
      if (!haveNoti) {
        return
      }

      const notification = new Notification({
        title: 'Coountdown',
        body: args.message,
      })

      notification.on('click', () => {
        mixpanel.track(app, 'View Notification')
        menubar.window.show()
      })

      notification.show()
    } catch (err) {
      Sentry.captureException(err)
    }
  })
})

app.on('before-quit', (event) => {
  if (!isQuit && process.env.CONNECTION === 'online') {
    const appQuitTime = moment()
    const durationTime = appQuitTime.diff(appLaunchTime)
    const sessionTimeMinutes = moment.duration(durationTime).asMinutes()

    mixpanel.updateTotalSession(sessionTimeMinutes)

    event.preventDefault()
    isQuit = true
    mixpanel.track(app, 'Quit App', { session_time_minutes: sessionTimeMinutes }, () => app.quit())
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
