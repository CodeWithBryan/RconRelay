import WebRcon from 'webrconjs';

class RconServer {

  id = -1;
  name = '';
  broadcast = (msg) => {};

  connected = false;
  rcon = null;
  config = null;

  constructor(config, server, broadcast) {
    this.broadcast = broadcast;

    this.config = config;

    this.id = server.id;
    this.name = server.name;

    this.rcon = new WebRcon(server.ip, server.port);
    this.rcon.on('connect', this.onConnect);
    this.rcon.on('disconnect', this.onDisconnect);
    this.rcon.on('message', this.onMessage);
    this.rcon.on('error', this.onMessage);

    this.connect(server.pass);
  }

  connect = (pass) => {
    try {
      this.rcon.connect(pass);
    } catch (e) {
      console.log(`[${this.name}] Reconnect Failed: `, e);
    }
  };

  onMessage = (msg) => {
    this.broadcast({ serverId: this.id, name: this.name, message: msg });
  };

  onConnect = () => {
    console.log(`[${this.name}] Connected`);
    this.connected = true;
    if (this.config.infoLoop.enabled)
      this.infoLoop();
  }

  onDisconnect = () => {
    console.log(`[${this.name}] Disconnected`);
    this.connected = false;

    setTimeout(() => {
      if (!connected) {
        this.connect();
      }
    }, this.config.reconnectTimeout ?? 2500);
  };

  infoLoop = () => {
    if (this.connected) {
      this.rcon.run('serverinfo');
      
      setTimeout(() => {
        this.infoLoop();
      }, this.config.infoLoop.time ?? 1000);
    }
  }
}

export default RconServer;