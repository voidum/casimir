const http = require('http');
const { getNextPort, getRandomInteger } = require('./shared');
const DiscoveryServer = require('./DiscoveryServer');

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
    this.discoveryServer = new DiscoveryServer();
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
      const payload = nextPort.toString();
      this.discoveryServer.fillup(payload);
      this.discoveryServer.listen();
    });
  }

  getPeerNodes() {
    return this.discoveryServer.peerNodes;
  }
}

module.exports = HttpServer;