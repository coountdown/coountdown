const { Notification } = require('electron')

module.exports = (
  title, body, onClick,
) => {
  const notification = new Notification({
    title,
    body,
  })

  if (onClick) {
    notification.on('click', () => {
      onClick()
    })
  }

  notification.show()
}
