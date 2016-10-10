//var WebSocketServer = require('websocket').server,
var http = require('http'),
    fs = require('fs'),
	server = http.createServer(function(request, response) {
    response.writeHead(200,{"Content-Type":"text/html"});
    fs.readFile('./main.html',function(err,content){
        response.write(content);
        response.end();
    })
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});
/*
wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: true
});
function originIsAllowed(origin) {
  //if(origin.replace(/http[s]?:\/\//,'').replace(/:\d{1,4}/,'')=='172.16.11.31')return true;
  return true;
}
wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin 
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    console.log(request.origin);
    var connection = request.accept('chat', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            if(message.utf8Data == "Annexation"){
            	connection.sendUTF("So many bugs we called pest control.");
            }
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

http.createServer(function(req,res){
	res.writeHead(200,{'Content-Type':'text/plain'});
	res.end('Hello World\n');
	var uri = url.parse(req.url).pathname;
}).listen(8080);
*/
