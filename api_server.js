const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require('cors');

const dgram = require('dgram');
let deviceIpAddress;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get("/", function (req, res) {
  return getDeviceIpAddress()
    .then((deviceIpAddress) => {
      res.send(deviceIpAddress);
    });
});

const server = app.listen(3000, function () {
  console.log("Listening on port %s...", server.address().port);
});


function getDeviceIpAddress() {
  console.log('calculating address...');
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket('udp4');

    socket.on('error', (err) => {
      console.log(`socket error:\n${err.stack}`);
      socket.close();
      reject('socket error');
    });

    socket.on('message', (msg, rinfo) => {
      console.log(`socket got: ${msg} from ${rinfo.address}:${rinfo.port}`);
      socket.close();
      resolve(rinfo.address);
    });

    socket.on('listening', () => {
      var address = socket.address();
      console.log(`socket listening ${address.address}:${address.port}`);
    });

    socket.bind(41234);
    // socket listening on 0.0.0.0:41234

    let sendBuffer = Buffer.from([0, 1, 0, 246]);
    socket.send(sendBuffer, 0, 4, 30718, '169.254.255.255');
  });
}


