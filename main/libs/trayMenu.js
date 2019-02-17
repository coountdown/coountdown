const { Menu, shell } = require('electron')
const Sentry = require('@sentry/node');
const mixpanel = require('../libs/mixpanel')
const dialog = require('../libs/dialog')
const config = require('../../config')


module.exports = {
  getDefault: (window, loggedIn, app) => {
    let menuTemplate = []
    menuTemplate = [
      {
        label: `About ${app.getName()}`,
        click() {
          dialog.openAboutDialog()
        },
      },
      {
        label: 'Support',
        click() {
          try {
            mixpanel.track(app, 'Menu: Open Support')
            shell.openExternal(config.WEB_URL)
          } catch (err) {
            Sentry.captureException(err)
          }
        },
      },
      {
        type: 'separator',
      },
      {
        role: 'quit',
        accelerator: 'CmdOrCtrl+Q',
      },
    ]

    return Menu.buildFromTemplate(menuTemplate)
  },
}
