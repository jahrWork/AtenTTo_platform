'use strict';

const http = require('http');

var fs = require('fs');
var path = require('path');

var time, power;


class Facility {
    constructor(name) {
        this.name = name;
        this.data = [];
        this.time = [];
    }
}

var ARCOS = new Facility("ARCOS");
var t1 = 0, t0 = 0; 
var time0 = 0; 


const listener = function (request, response) {

    var pathFile, i, filename, content, facility, params;


  //  console.log("url =", request.url);

    if (request.method === "POST") {

        i = request.url.indexOf("?");
        facility = request.url.substr(0, i);
        params = request.url.substr(i);
        params = new URLSearchParams(params);

        t1 = params.get('time');
        power = params.get('power');

        var d = new Date();
        time = d.getHours() + d.getMinutes()/60. + d.getSeconds()/3600.

        if (ARCOS.time.length == 0) { time0 = time; t0 = t1 }
     //   console.log("facility=", facility);
      //  console.log("time=", time, "power=", power);
        if (time <= time0) time = time0 + (t1 - t0) / (3600 * 1000.)
        if (power == null) power = 0.0;

        ARCOS.time.push(time);
        ARCOS.data.push(power);


        time0 = time; 
        t0 = t1; 

    //    console.log("time=", time, " power =", power);
    }
    else {
        var filePath = '.' + request.url;
        if (filePath == './')
            filePath = './index.html';

        var extname = path.extname(filePath);
        var contentType = 'text/html';
        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
                contentType = 'image/jpg';
                break;
            case '.wav':
                contentType = 'audio/wav';
                break;
        }

        fs.readFile(filePath, function (error, content) {
            if (error) {
                if (error.code == 'ENOENT') {
                    fs.readFile('./404.html', function (error, content) {
                        response.writeHead(200, { 'Content-Type': contentType });
                        response.end(content, 'utf-8');
                    });
                }
                else {
                    response.writeHead(500);
                    response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                    response.end();
                }
            }
            else {
                response.writeHead(200, { 'Content-Type': contentType });
                response.end(content, 'utf-8');
            }
        });


    }
}

const server = http.createServer(listener);

var io = require('socket.io')(server);; 

var authentication; 

exports.listen = function ( port )
{
    server.listen(port); 

    //  require socket.io module and pass the http object (server)
    console.log('ARCOS listening on port = ', port);

    // Emit welcome message on connection  
    // Use socket to communicate with this particular client only, sending it it's own id
    io.on('connection', function (socket) {

        
        console.log("Try socket connection"); 
        socket.emit('welcome', { message: 'ARCOS:', id: socket.id });
        socket.on('user', function (d) {
            console.log(d)
            if (d.user == "David" && d.password == "1234") {
                authentication = true; 
            }
            else {
                socket.emit("error", { message: "Wrong user or password" }); 
                authentication = false; 
            }
        }); 
     });
   
}



// Send current time to all connected clients
exports.data = function()
{
    if (authentication) {
        io.emit('data', { time: time, power: power });
        return ARCOS;
    }
    else return ARCOS; 
   

}




