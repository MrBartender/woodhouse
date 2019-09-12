const awsIot = require('aws-iot-device-sdk')
const path = require('path')
const license = require('./certs/license')

// Initialize the IoT MQTT client
const thingShadows = awsIot.thingShadow({
  keyPath: path.resolve('.', 'certs/node-private-key.pem'),
  certPath: path.resolve('.', 'certs/node-cert.pem'),
  caPath: path.resolve('.', 'certs/Amazon_Root_CA_1.pem'),
  clientId: license.deviceName,
  host: license.host
})

// Helper function to send updates and flag errors
function sendUpdate(desired) {
  const clientTokenUpdate = thingShadows.update(license.deviceName, {
    'state': {
      'desired': desired
    }
  })

  // If null, the shadow is currently updating and should try again
  if (clientTokenUpdate === null) {
    console.log('update shadow failed, operation still in progress');
  }
}
// When we start, tell the backend we are live, subscribe to the shadow
thingShadows.on('connect', () => {
  thingShadows.register(license.deviceName, {}, () => {
    sendUpdate({ 'queue': [
      {
        'orderId': 1234,
        'name': 'Screwdriver',
        'ingredients': [
          'oj', 'vodka'
        ]
      }
    ] })
  })
})

// Status events
thingShadows.on('status', (thingName, status, _clientToken, stateObject) => {
  console.log('received ' + status + ' on ' + thingName + ': ' + JSON.stringify(stateObject))

  // Use logic when a clean request and a state is desired
  if (status === 'accepted' && stateObject && stateObject.state) {
    const state = stateObject.state.desired;
    console.log('inside accepted; state is: ' + JSON.stringify(state))

    // Handle a queued order
    if (state && state.queue && state.queue.length > 0) {
      const { queue } = state

      console.log('inside queue breaker, queue has: ' + queue.length)
      const order = queue.shift()

      // Handle pour logic
      console.log('pouring: ' + JSON.stringify(order))
      console.log('updating queue, new queue: ' + JSON.stringify(queue))

      // Save the queue after removing one
      sendUpdate({ 'queue': queue })
    }
  }
})

// Delta events
// thingShadows.on('delta', (thingName, stateObject) => {
//   console.log('received delta on ' + thingName + ': '+ JSON.stringify(stateObject))
// })

// Timeout events
thingShadows.on('timeout', (thingName, clientToken) => {
  console.log('received timeout on ' + thingName + ' with token: ' + clientToken)
})
