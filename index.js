import { WebSocketServer } from 'ws';
import { config } from 'dotenv';
import WebRcon from 'webrconjs';

config();

let connected = false;
const rcon = new WebRcon(process.env.RCON_IP, process.env.RCON_PORT);

const wss = new WebSocketServer({
  port: process.env.RELAY_PORT ?? 3000,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  }
});

const broadcast = (msg) => wss.clients.forEach((client) => {
  client.send(JSON.stringify(msg));
});

const reconnect = () => {
  rcon.connect(process.env.RCON_PASS);
  setTimeout(() => {
    if (!connected) {
      reconnect();
    }
  }, process.env.RECONNECT_TIMEOUT ?? 2500);
};

const infoLoop = () => {
  if (connected && process.env.ENABLE_INFO_LOOP === 'true') {
    rcon.run('serverinfo')
    
    setTimeout(() => {
      infoLoop();
    }, process.env.INFO_LOOP_TIME ?? 1000);
  }
}

rcon.on('connect', () => {
  console.log('Connected!');
  connected = true;
  infoLoop();
});

rcon.on('disconnect', () => {
  console.log('Disconnected... attempting to reconnect');
  connected = false;
  reconnect();
});

rcon.on('message', (msg) => broadcast(msg));
rcon.on('error', (err) => broadcast(err));

reconnect();