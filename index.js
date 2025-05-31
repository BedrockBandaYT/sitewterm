
const express = require('express');
const { spawn } = require('node-pty');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const os = require('os');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  const ptyProcess = spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env
  });

  ptyProcess.on('data', function (data) {
    ws.send(data);
  });

  ws.on('message', function (msg) {
    ptyProcess.write(msg);
  });

  ws.on('close', function () {
    ptyProcess.kill();
  });
});

app.get('/', (req, res) => {
  res.send("Web Terminal Backend Running");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
