const os = require('os')
const Mixpanel = require('mixpanel')
const { machineId } = require('node-machine-id')
const moment = require('moment')
const config = require('../../config')

const mixpanel = Mixpanel.init(config.MIXPANEL_TOKEN)

module.exports = {
  track: async (app, event, props, callback) => {
    try {
      const currentMachineId = await machineId()
      const appVersion = app && 'getVersion' in app ? app.getVersion() : 'Unknown'

      mixpanel.people.set(currentMachineId, {
        distinct_id: currentMachineId,
        name: 'Anonymous',
        app_version: appVersion,
        electron_version: process.versions.electron,
        process: process.type,
        platform: os.platform(),
        platform_release: os.release(),
      })

      // Dont' overwrite old properties
      mixpanel.people.set_once(currentMachineId, { created_at: moment().format('LLLL') })

      mixpanel.track(
        event,
        Object.assign(
          {
            distinct_id: currentMachineId,
            app_version: appVersion,
            electron_version: process.versions.electron,
            process: process.type,
            platform: os.platform(),
            platform_release: os.release(),
          },
          props,
        ),
        callback,
      )
    } catch (err) {
      console.error(err)
    }
  },
  addUserId: async (userId) => {
    const currentMachineId = await machineId()
    mixpanel.people.set(currentMachineId, { user_id: userId })
  },
  increment: async (session) => {
    const currentMachineId = await machineId()
    mixpanel.people.increment(currentMachineId, 'total_session', session)
  },
}
