const { app } = require('electron')
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
console.log(`Frontend: ${config.FRONTEND_URL}.`)

setupSentry(app)
app.setName(config.APP_NAME)

// Hide dock icon (In production mode, it's setup on package.json. [key: LSUIElement])
if (isDev && electronUtil.is.macos) {
  app.dock.hide()
}

// Process Cycle
app.on('ready', async () => {
  // Check update
  // Check app location on mac os
  // Create tray
  // Create tray menu
  // Setup event
  console.log('Ready')
})
