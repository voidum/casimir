const dgram = require('dgram');
const querystring = require('querystring');
const { getMD5Hash, getNextPort } = require('./shared');

const FirstPort = 36001;
const MaxStartCount = 10;
const MaxHelloCounts = [1, 2, 4, 7, 12, 20, 33, 54, 88, 143];
const MaxHelloInterval = 10 * 1e3; // 10s
const MinHelloInterval = 1 * 1e3; // 1s
const Membership = '239.255.0.42';

function buildMessage(name, body) {
  if (name.indexOf('|') >= 0) {
    throw new Error('invalid message name');
  }
  const data = querystring.stringify(body);
  const join = `${name}|${data}`;
  const hash = getMD5Hash(join);
  const message = `casimir|v1|${hash}|${join}`;
  return new Buffer(message);
}

function parseMessage(message) {
  const parts = message.split('|');
  if (parts[0] !== 'casimir') {
    console.error('message broken');
    return null;
  }
  if (parts[1] !== 'v1') {
    console.error('version not support');
    return null;
  }
  const hash = parts[2];
  const join = `${parts[3]}|${parts[4]}`;
  if (hash !== getMD5Hash(join)) {
    console.error('message broken');
    return null;
  }
  return {
    name: parts[3],
    body: querystring.parse(parts[4])
  };
}

class HelloServer {
  constructor(options) {
    if (!options) options = {};
    this.name = options.name;
    this.payload = null;
    this.callback = null;
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

  listen(callback) {
    this.callback = callback;
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
    console.log(`got ${message} from ${emitter.address}:${emitter.port}`);
    const request = parseMessage(message.toString());
    if (!request) return;
    if (request.name !== this.name) {
      console.error('server not matched');
      return;
    }
    // raise event
    if (this.callback) {
      this.callback(request.body, emitter);
    }
    // slow down hello
    this.helloInterval += 1e3;
    if (this.helloInterval > MaxHelloInterval) {
      this.helloInterval = MaxHelloInterval;
    }
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
    const helloMessage = buildMessage(this.name, this.payload);
    for (let i = 0; i < this.helloPorts.length; i ++) {
      const port = this.helloPorts[i];
      this.socket.send(helloMessage, port, Membership);
      console.log('sent hello', port);
    }
  }
}

module.exports = HelloServer;