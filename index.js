const awsIot = require('aws-iot-device-sdk')
const path = require('path')
const clientName = 'Woodhouse1'

// Initialize the IoT MQTT client
const thingShadows = awsIot.thingShadow({
  keyPath: path.resolve('.', 'certs/node-private-key.pem'),
  certPath: path.resolve('.', 'certs/node-cert.pem'),
  caPath: path.resolve('.', 'certs/Amazon_Root_CA_1.pem'),
  clientId: clientName,
  host: 'a2deqfzrx988q4-ats.iot.us-west-2.amazonaws.com'
})

// When we start, tell the backend we are live, subscribe to the shadow
thingShadows.on('connect', () => {
  thingShadows.register(clientName, {}, () => {
    const clientTokenUpdate = thingShadows.update(clientName, {
      'state': {
        'desired': {
          'queue': []
        }
      }
    })

    // If null, the shadow is currently updating and should try again
    if (clientTokenUpdate === null) {
      console.log('update shadow failed, operation still in progress');
    }
  })
})

// Status events
thingShadows.on('status', (thingName, stat, _clientToken, stateObject) => {
  console.log('received ' + stat + ' on ' + thingName + ': ' + JSON.stringify(stateObject))
})

// Delta events
// thingShadows.on('delta', (thingName, stateObject) => {
//   console.log('received delta on ' + thingName + ': '+ JSON.stringify(stateObject))
// })

// Timeout events
thingShadows.on('timeout', (thingName, clientToken) => {
  console.log('received timeout on ' + thingName + ' with token: ' + clientToken)
})
