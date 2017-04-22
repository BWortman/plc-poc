const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require('cors');
const dgram = require('dgram');

const apiServerPortNumber = 3000;
const devicePortNumber = 30718
const magicPacket = [0, 1, 0, 246];
const sourceIpAddress = '169.254.255.255'; // Blast it to the whole subnet
const refreshIntervalInMs = 10000;
const socketTimeoutInMs = 9000;

let deviceIpAddress; // only expect 1 for this local POC

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get("/devices", function (req, res) {
  console.log(`Found device at ${deviceIpAddress}`);
  res.send(deviceIpAddress);
});

const server = app.listen(apiServerPortNumber, () => {
  console.log("Listening on port %s...", server.address().port);

  getDeviceIpAddress();
});

function getDeviceIpAddress() {
  console.log('Finding devices...');
  return new Promise((resolve, reject) => {
    const socketPortNumber = 41234;
    const socket = dgram.createSocket('udp4');
    let dataReceived;

    socket.on('error', (err) => {
      console.log(`socket error:\n${err.stack}`);
      socket.close();

      reject('socket error');
      setTimeout(() => getDeviceIpAddress(), refreshIntervalInMs);
    });

    socket.on('message', (msg, rinfo) => {
      console.log(`socket got: ${msg} from ${rinfo.address}:${rinfo.port}`);
      socket.close();

      dataReceived = true;
      deviceIpAddress = rinfo.address;
      resolve(deviceIpAddress);
      setTimeout(() => getDeviceIpAddress(), refreshIntervalInMs);
    });

    socket.on('listening', () => {
      var address = socket.address();
      console.log(`socket listening ${address.address}:${address.port}`);
    });

    setTimeout(() => {
      if (!dataReceived) {
        console.log('no data found. closing socket.');
        socket.close();
        setTimeout(() => getDeviceIpAddress(), refreshIntervalInMs);
      }
    }, socketTimeoutInMs);

    socket.bind(socketPortNumber);

    let sendBuffer = Buffer.from(magicPacket);
    socket.send(sendBuffer, 0, 4, devicePortNumber, sourceIpAddress);
  });
}


