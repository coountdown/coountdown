const menubar = require('menubar')
const isDev = require('electron-is-dev')
const mixpanel = require('./mixpanel')
const config = require('../../config')

module.exports = (tray, app) => {
  const mb = menubar({
    tray,
    index: config.APP_URL,
    height: 600,
    width: 400,
    movable: false,
    resizable: false,
    preloadWindow: true,
    hasShadow: true,
    transparent: true,
    center: false,
    darkTheme: true,
    show: false,
    webPreferences: {
      devTools: isDev,
    },
  })

  mb.showWindow()
  mb.on('show', () => {
    mixpanel.track(app, 'Active App')
  })

  mb.on('after-create-window', () => {
    // Can open developer tools
  })

  mb.on('after-show', () => {})

  return mb
}
