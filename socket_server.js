var net = require('net');

var WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({ port: 8181 });

wss.on('connection', function (ws) {
  console.log('client connected');
  ws.send('connected!');
  ws.on('message', function (message) {
    var jsonMessage = JSON.parse(message);
    console.log(`command: ${jsonMessage.command}, ip: ${jsonMessage.ip}`);


    testP2(ws, jsonMessage.command, jsonMessage.ip);
    //ws.send('received ' + message);
  });
});



function testP2(ws, command, ip) {
  var client = new net.Socket();
  client.connect(10001,ip, function () {
    console.log('Connected to P2');
    client.write(command + '\r\n');
    console.log('Sent command, waiting on response...');
  });

  client.on('data', function (data) {
    console.log('got response!');
    console.log('Received: ' + data);

    ws.send(data.toString());

    //client.destroy(); // kill client after server's response
  });

  client.on('close', function () {
    console.log('Connection closed');
  });}

