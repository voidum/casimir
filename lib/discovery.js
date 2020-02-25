const dgram = require('dgram');
const { getNextPort } = require('./core.js');

const MaxRetryCount = 20;
const Membership = '239.255.0.42';

class DiscoveryServer {
  constructor() {
    this.records = [];
    this.retryCount = 0;
    this.windowTime = 0;
    this.portSeries = [];
    this.socket = dgram.createSocket('udp4');
    this.socket.on('error', (error) => {
      console.error(error.stack);
      this.socket.close();
      if (this.retryCount < MaxRetryCount) {
        this.socket.retryNextPort();
      }
    });
    this.socket.on('message', this.handleRequest.bind(this));
    this.socket.on('listening', () => {
      this.socket.setMulticastTTL(16);
      this.socket.addMembership(Membership);
    });
  }

  start() {
    this.retryNextPort(40000);
    this.portSeries.push(getNextPort(40000));
    this.updateLooper();
  }

  close() {
    this.socket.close();
    clearTimeout(this.looper);
    this.retryCount = 0;
    this.windowTimeTime = 0;
    this.portSeries = [];
  }

  handleRequest(message, emitter) {
    this.windowTime /= 2;
    console.log(`got ${message} from ${emitter.address}:${emitter.port}`);
  }

  retryNextPort(prevPort) {
    this.retryCount += 1;
    const nextPort = getNextPort(prevPort);
    this.socket.bind(nextPort);
  }

  updateLooper() {
    if (this.windowTime < 1e4) {
      this.windowTime += 500;
    }
    this.looper = setTimeout(this.updateLooper.bind(this), this.windowTime);
    this.sendMessage();
  }

  sendMessage() {
    if (this.portSeries.length < MaxRetryCount) {
      const nextPort = getNextPort(this.portSeries[this.portSeries.length - 1]);
      this.portSeries.push(nextPort);
    }
    for (let i = 0; i < this.portSeries.length; i ++) {
      const port = this.portSeries[i];
      console.log(port);
      const buffer = new Buffer((new Date()).toLocaleString());
      this.socket.send(buffer, port, Membership);
    }
  }
}

module.exports = DiscoveryServer;