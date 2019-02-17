const { app, dialog } = require('electron')

module.exports = {
  openAboutDialog: () => {
    dialog.showMessageBox({
      message: `${app.getName()} Desktop App`,
      detail: `Build ${app.getVersion()} \nCopyright © 2019 ${app.getName()}.`,
      buttons: [],
    })
  },
}
