# Casimir

`Casimir` is a wrapper for http server with auto port and nearby network discovery.

## Usage

### install as dependency

```
npm install --save casimir
```

### develop your server

```
const casimir = require('casimir');

// define your handler
function handleRequest(request, response) {
  // todo - write your handlers
}

// wrap handler with casimir
const server = casimir
  .createServer('server-name', handleRequest)
  .listen();

// 239.0.0.0 ~ 239.255.255.255
console.log(server.name, server.port);
```