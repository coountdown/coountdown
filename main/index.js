const { app, BrowserWindow, ipcMain } = require('electron')
const { resolve: resolveRootPath } = require('app-root-path')
const fixPath = require('fix-path')
const isDev = require('electron-is-dev')
const electronUtil = require('electron-util')

const { setupSentry } = require('./libs/sentry')

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
const appLaunchTime = Date.now()

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

  console.log('Ready')
  console.log('Launch on', appLaunchTime)
})
