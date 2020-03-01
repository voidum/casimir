# Casimir

`Casimir` is a wrapper for http server with auto port and nearby network discovery.

## Usage

### install as dependency

```
npm install --save casimir
```

### develop your server

```
const { HttpServer } = require('casimir');

// define your handler
function handleRequest(request, response) {
  // todo - write your handlers
}

// wrap handler with casimir
const server = new HttpServer(
  { name: 'server-name' },
  handleRequest
).listen();

// output debug message
console.log(server.name, server.port);
setInterval(() => {
  console.log(server.peerNodes);
}, 3000);
```