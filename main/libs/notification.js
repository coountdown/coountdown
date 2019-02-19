const { Notification } = require('electron')

module.exports = (
  title, body, silent, onClick,
) => {
  const notification = new Notification({
    title,
    body,
    silent,
  })

  if (onClick) {
    notification.on('click', () => {
      onClick()
    })
  }

  notification.show()
}
