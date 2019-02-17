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
const menubarLib = require('./libs/menubar')
const trayMenu = require('./libs/trayMenu')

// Setup env before require config file
require('dotenv').config()
const config = require('../config')

// Fix path process
fixPath()

// Announcement for development
console.log(`On ${isDev ? 'development' : 'production'} mode.`)
console.log(`WEB: ${config.WEB_URL}`)
console.log(`APP: ${config.APP_URL}`)

// Constants
let onlineStatusWindow
let twitterLoginWindow
let tray
let isQuit = false
let loggedIn = false
let alreadyGetUser = false
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

  onlineStatusWindow.loadURL(`file://${resolveRootPath('./main/static/pages/online-status.html')}`)

  // Update internet connection
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
  const menubar = menubarLib(tray, app)

  console.log('App Ready')
  console.log('Launch on', appLaunchTime.format('LLL'))
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
    mixpanel.track(app, 'Menu: Show Setting')
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
})

app.on('before-quit', (event) => {
  if (!isQuit && process.env.CONNECTION === 'online') {
    const appQuitTime = moment();
    const durationTime = appQuitTime.diff(appLaunchTime)
    const sessionTimeMinutes = moment.duration(durationTime).asMinutes()

    mixpanel.updateTotalSession(sessionTimeMinutes)

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
