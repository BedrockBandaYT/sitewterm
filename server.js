const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const { Client: SSHClient } = require('ssh2');
const FTPClient = require('ftp');
const Telnet = require('telnet-client');
const cors = require('cors');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', async (message) => {
        console.log(`Received: ${message}`);
        const { protocol, username, password, host, port, command } = JSON.parse(message);

        try {
            switch (protocol) {
                case 'ssh':
                    await handleSSH(username, password, host, port, command, ws);
                    break;
                case 'sftp':
                    await handleSFTP(username, password, host, port, command, ws);
                    break;
                case 'ftp':
                    await handleFTP(username, password, host, port, command, ws);
                    break;
                case 'telnet':
                    await handleTelnet(username, password, host, port, command, ws);
                    break;
                default:
                    ws.send(JSON.stringify({ error: 'Unsupported protocol' }));
            }
        } catch (error) {
            ws.send(JSON.stringify({ error: error.message }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Handle SSH connections
async function handleSSH(username, password, host, port, command, ws) {
    const conn = new SSHClient();
    conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
            if (err) {
                ws.send(JSON.stringify({ error: err.message }));
                return;
            }
            stream.on('close', () => {
                conn.end();
            }).on('data', (data) => {
                ws.send(JSON.stringify({ output: data.toString() }));
            }).stderr.on('data', (data) => {
                ws.send(JSON.stringify({ error: data.toString() }));
            });
        });
    }).connect({ host, port, username, password });
}

// Handle SFTP connections
async function handleSFTP(username, password, host, port, command, ws) {
    const conn = new SSHClient();
    conn.on('ready', () => {
        conn.sftp((err, sftp) => {
            if (err) {
                ws.send(JSON.stringify({ error: err.message }));
                return;
            }
            // Example command: list files in the home directory
            sftp.readdir(command, (err, list) => {
                if (err) {
                    ws.send(JSON.stringify({ error: err.message }));
                } else {
                    ws.send(JSON.stringify({ output: list }));
                }
                conn.end();
            });
        });
    }).connect({ host, port, username, password });
}

// Handle FTP connections
async function handleFTP(username, password, host, port, command, ws) {
    const client = new FTPClient();
    client.on('ready', () => {
        client.list(command, (err, list) => {
            if (err) {
                ws.send(JSON.stringify({ error: err.message }));
            } else {
                ws.send(JSON.stringify({ output: list }));
            }
            client.end();
        });
    });
    client.connect({ host, port, user: username, password });
}

// Handle Telnet connections
async function handleTelnet(username, password, host, port, command, ws) {
    const client = new Telnet();
    const params = {
        host,
        port,
        shellPrompt: '/ # ',
        timeout: 1500,
        loginPrompt: 'login: ',
        passwordPrompt: 'Password: ',
        username,
        password,
    };

    try {
        await client.connect(params);
        const response = await client.exec(command);
        ws.send(JSON.stringify({ output: response }));
        client.end();
    } catch (error) {
        ws.send(JSON.stringify({ error: error.message }));
    }
}

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
