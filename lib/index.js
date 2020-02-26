const HttpServer = require('./HttpServer');

function handleRequest(request, response) {
  response.writeHead(200);
  response.write('test');
  response.end();
}

const httpServer = new HttpServer(null, handleRequest);
httpServer.listen();