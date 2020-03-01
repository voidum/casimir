const http = require('http');
const { getNextPort, getRandomInteger } = require('./shared');
const DiscoveryServer = require('./HelloServer');

const FirstPortSeed = 3000;
const MaxStartCount = 1e3;

class HttpServer {
  constructor(options, handler) {
    if (!options) options = {};
    if (!handler) throw new Error('invalid handler');
    this.name = options.name;
    this.server = http.createServer(handler);
    this.server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        this.server.close();
        this.server.listen(PORT, HOST);
      }
    });
    this.peerNodes = [];
    this.discoveryServer = new DiscoveryServer({ name: options.name });
    this.triedStartCount = 0;
  }

  listen() {
    const firstPort = FirstPortSeed + getRandomInteger(0, 1000);
    this.retryNextPort(firstPort);
  }

  retryNextPort(prevPort) {
    this.triedStartCount += 1;
    if (this.triedStartCount > MaxStartCount) {
      throw new Error('too many listen error');
    }
    const nextPort = getNextPort(prevPort);
    this.server.listen(nextPort, () => {
      const payload = { port: nextPort };
      this.discoveryServer.fillup(payload);
      this.discoveryServer.listen(this.handleHello.bind(this));
    });
  }

  handleHello(message, emitter) {
    if (message.port) {
      const oldPeerNode = this.peerNodes.find(e => {
        return e.address === emitter.address;
      });
      if (!oldPeerNode) {
        this.peerNodes.push({
          address: emitter.address,
          udpPort: emitter.port,
          tcpPort: Number(message.port)
        });
      }
    }
  }

  getPeerNodes() {
    return this.peerNodes;
  }
}

module.exports = HttpServer;