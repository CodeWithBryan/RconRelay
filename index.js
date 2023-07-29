import { createServer } from 'http';
import * as fs from 'fs';
import WebSocket, { WebSocketServer } from 'ws';
import RconServer from './rcon-server.js';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const server = createServer();
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', function upgrade(request, socket, head) {
  if (!request.url.includes(config.apiToken)) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit('connection', ws, request);
  });

});

const broadcast = (msg) => wss.clients.forEach((client) => {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(msg));
  }
});

for (const server of config.servers) {
  new RconServer(config, server, broadcast);
}

console.log('Starting Server');

server.listen(config.relayPort);