const net = require('net');
const events = require('events');

let eventEmitter = new events.EventEmitter();

let WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({ port: 8181 });

let serverList = [];

wss.on('connection', (websocket) => {
  console.log('client connected');
  websocket.send('connected!');

  websocket.on('message', (message) => {
    let jsonMessage = JSON.parse(message);
    console.log(`command: ${jsonMessage.command}, ip: ${jsonMessage.ip}`);

    let tester;
    if (serverList.length < 1) {
      tester = new P2Tester(jsonMessage.ip);
      serverList.push(tester);
    }
    else {
      tester = serverList[0];
    }

    eventEmitter.on('p2DataReceived', (data) => {
      websocket.send(data.toString());
    });
    tester.sendCommandToDevice(jsonMessage.command, websocket);
  });
});

function P2Tester(deviceIp) {
  let self = this;
  this.client = new net.Socket();

  this.client.connect(10001, deviceIp, () => {
    console.log('Connected to P2');
  });

  this.sendCommandToDevice = (command) => {
    self.client.write(command + '\r\n');
    console.log('Sent command, waiting on response...');
  };

  this.client.on('data', (data) => {
    console.log('got response!');
    console.log('Received: ', data);
    eventEmitter.emit('p2DataReceived', data.toString());
  });

  this.client.on('close', () => {
    console.log('Connection closed');
  });
}
