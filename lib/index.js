const HttpServer = require('./HttpServer');

function handleRequest(request, response) {
  response.writeHead(200);
  response.write('test');
  response.end();
}

const httpServer = new HttpServer({ name: 'test' }, handleRequest);
httpServer.listen();

setInterval(() => {
  console.log(httpServer.getPeerNodes());
}, 2000);