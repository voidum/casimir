const dgram = require('dgram');
const { getNextPort } = require('./shared');

const FirstPort = 36001;
const MaxStartCount = 10;
const MaxHelloCounts = [1, 2, 4, 7, 12, 20, 33, 54, 88, 143];
const MaxHelloInterval = 10 * 1e3; // 10s
const MinHelloInterval = 1 * 1e3; // 1s

const Membership = '239.255.0.42';

function parseHello(message) {
  return true;
}

function writeHello(payload) {
  const message = `casimir-${Date.now()}-${payload}`
  const buffer = new Buffer(message);
  return buffer;
}

class DiscoveryServer {
  constructor() {
    this.payload = null;
    this.peerNodes = [];
    // reset hello
    this.helloPorts = [];
    this.helloLooper = NaN;
    this.helloInterval = MinHelloInterval;
    this.triedHelloStage = 0;
    this.triedHelloCount = 0;
    // reset start
    this.socket = dgram.createSocket('udp4');
    this.socket.on('error', (error) => {
      console.error(error.stack);
      this.socket.close();
      // todo - only while port bind fail
      if (this.triedStartCount < MaxStartCount) {
        this.socket.retryNextPort();
      }
    });
    this.socket.on('message', this.handleRequest.bind(this));
    this.socket.on('listening', () => {
      this.socket.setMulticastTTL(16);
      this.socket.addMembership(Membership);
    });
    this.triedStartCount = 0;
  }

  listen() {
    this.retryNextPort(FirstPort);
    this.retryHello();
  }

  finish() {
    // clear hello
    clearTimeout(this.looper);
    this.helloPorts = [];
    this.helloLooper = NaN;
    this.helloInterval = 0;
    this.triedHelloStage = 0;
    this.triedHelloCount = 0;
    // clear start
    this.socket.close();
    this.triedStartCount = 0;
  }

  fillup(payload) {
    this.payload = payload;
  }

  handleRequest(message, emitter) {
    if (parseHello(message)) {
      // todo - only while new hello got
      // slow down hello
      this.helloInterval += 1e3;
      if (this.helloInterval > MaxHelloInterval) {
        this.helloInterval = MaxHelloInterval;
      }
    }
    console.log(`got ${message} from ${emitter.address}:${emitter.port}`);
  }

  retryNextPort(prevPort) {
    this.triedStartCount += 1;
    const nextPort = getNextPort(prevPort);
    if (this.helloPorts.indexOf(nextPort) < 0) {
      this.helloPorts.push(nextPort);
    }
    this.socket.bind(nextPort);
  }

  retryHello() {
    this.triedHelloCount += 1;
    const MaxHelloCount = MaxHelloCounts[this.triedHelloStage];
    if (this.triedHelloCount >= MaxHelloCount) {
      // open up hello ports
      if (this.triedHelloStage < MaxHelloCounts.length - 1) {
        this.triedHelloStage += 1;
        this.helloPorts.push(getNextPort(this.helloPorts[this.helloPorts.length - 1]));
      }
      // speed up hello
      this.helloInterval /= 2;
      if (this.helloInterval < MinHelloInterval) {
        this.helloInterval = MinHelloInterval;
      }
    }
    // send hello message
    this.helloLooper = setTimeout(this.retryHello.bind(this), this.helloInterval);
    const helloMessage = writeHello(this.payload);
    for (let i = 0; i < this.helloPorts.length; i ++) {
      const port = this.helloPorts[i];
      this.socket.send(helloMessage, port, Membership);
      console.log('sent hello', port);
    }
  }
}

module.exports = DiscoveryServer;