const Store = require('electron-store')

const store = new Store()

module.exports = {
  get: key => store.get(key),
  set: (key, value) => store.set(key, value),
  setupNoti: () => {
    const haveValue = store.get('noti', 0)

    if (haveValue === 0) {
      return store.set('noti', true)
    }

    return store.set('noti', haveValue)
  },
}
