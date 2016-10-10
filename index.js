"use strict";
process.title = "The Ultimate Chat";
var wsPort = 80,
	wsServer = require('websocket').server,
	http = require('http'),
	fs = require('fs'),
	history = [],
	clients = [],
	ips = ['192.168.1.104','192.168.1.3','172.16.11.31','127.0.0.1','10.201.172.187','46.137.168.242','localhost'],
	roles = ["user","moderator","admin"],
	passwords = ['Crafters_21'],
	esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'),
	allowOrigin=o=>ips.indexOf(o.replace(/http[s]?:\/\//,'').replace(/:\d{4}$/,''))>=0;

var wsHttpServer = http.createServer(function(req,res){
	fs.readFile("client.html",function(err,data){
		if(err){console.log("Error serving client.html");res.writeHead(500);res.end();}
		res.writeHead(200,{"Content-Type":"text/html"});
		res.end(data);
	});
});
wsHttpServer.listen(wsPort, function() { console.log(new Date + " Server is listening on port " + wsPort); });

var wsServerInstance = new wsServer({ httpServer: wsHttpServer });
wsServerInstance.on('request',function(req){
	console.log(new Date + " Request from: " + req.origin);
  if (!allowOrigin(req.origin)) {
    req.reject();
    console.log((new Date()) + ' Connection from origin ' + req.origin + ' rejected.');
    return;
  }
	var con = req.accept('chat', req.origin),
		index = clients.push(con) -1,
		username;
	console.log(new Date + ' Connection accepted.');
	//con.sendUTF(JSON.stringify(con)); // DEBUG
	if (history.length > 0) con.sendUTF(JSON.stringify({type:'history',text:history}));
	con.on('message',function(msg){
		if(msg.type === 'utf8') {
			var str = esc(msg.utf8Data);
			if(!username){
				username = esc(str);
				for(var i=0,l=clients.length;i<l;i++){
					if(clients[i].username == username){
						con.sendUTF(JSON.stringify({type:"error",text:username + " is already taken, please retry."}));
						return username = undefined;
					}
				}
				con.username = username;
				con.role = 0;
				console.log(new Date + " " + username + " has joined the chat.");
				con.sendUTF(JSON.stringify({type:"init",text:username}));
				var obj = {
					type:"me",
					time: (new Date).getTime(),
					text:" has joined",
					from: username
				};
				broadcast(obj);
			}else if(str[0]=='/'){
			/*
				COMMANDS
				/me <action>
				/kick <user>
				/ignore <user>
				/mute <user> <time>
				/report <user> <reason>
				/op <password>
				/title <title>
				/yes
				/no
				/ai <activate|deactivate>
			*/
				var cmd = str.slice(1).split(' '), obj = {type:"cmd"};
				switch(cmd[0]){
					case 'op':
						if(con.role == 2){
							var target = search(cmd[1]);
							if(target){
								target.role = cmd[2] || 1;
								obj.text = cap(roles[target.role]) + " access granted by " + username + " to " + target.username + ".";
								broadcast(obj);
							}else{
								obj.text = "Error: unable to find " + cmd[1] + ".";
								broadcast(obj);
							}
							return;
						}else if(passwords.indexOf(cmd[1])>=0){
							con.role = 2;
							obj.text = "Admin access granted for " + username + ".";
						}else obj.text = "Admin access denied for " + username + ".";
						broadcast(obj);
					break;
					case 'deop':
						var target = search(cmd[1]);
						if(!target){
							obj = time(obj);
							obj.text = "Error: unable to find " + cmd[1] + ".";
							send(con,obj);
							return;
						}else if(target.role >= con.role){
							obj = time(obj);
							obj.text = "Error: Insufficient permission";
							send(con,obj);
							obj.text = "Warning: " + con.username + " tried to de-op you.";
							send(target,obj);
							return;
						}else{
							obj.text = cap(roles[target.role]) + " access removed by " + username + " from " + target.username + ".";
							target.role = "user";
							broadcast(obj);
						}
					break;
					case 'me':
						obj.from = username;
						obj.type = cmd.shift();
						obj.text = cmd.join(' ');
						broadcast(obj);
					break;
					case 'kick':
						var target = search(cmd[1]);
						if(!target){
							obj = time(obj);
							obj.text = 'Error: user ' + cmd[1] + ' does not exist.';
							send(con,obj);
							return;
						}else if(target.role >= con.role){
							obj = time(obj);
							obj.text = 'Error: Insufficient permission.';
							send(con,obj);
							obj.text = 'Warning: ' + con.username + " tried to kick you.";
							send(target,obj);
							return;
						}
						if(con.role){
							obj.from = "Server";
							obj.type = "end";
							obj = time(obj);
							obj.text = target.username + ' was kicked by ' + username;
							if(cmd[2])obj.text += ' because ' + cmd.slice(2).join(' ') + "."; 
							else obj.text += ".";
							send(target,obj);
							obj.type = "msg";
							broadcast(obj);
						}
					break;
					case 'report':
						var reported = search(cmd[1]);
						if(reported){
							obj.text = cmd[1] + ' is reported for ' + cmd[2] + '. Type /yes to punish this user, or /no to cancel the report.';
							broadcast(obj);
						}
						break;
					break;
					case 'msg':
					case 'tell':
					case 'm':
					case 'pm':
					break;
				}
			}else{
				console.log(new Date + ' ' + username + ': ' + msg.utf8Data);
        var obj = {
          type: "msg",
          text: esc(msg.utf8Data),
          from: username,
        };
        broadcast(obj);
			}
		}
	});
	con.on('close', function(con) {
    if (username !== false) {
    	var obj = {type:"me",text:con.username + " has left.",from:con.username}
    	broadcast(obj);
      console.log(new Date + " Peer "+ (con.remoteAddress||con.username) + " disconnected.");
      clients.splice(index, 1);
    }
  });
});
function broadcast(obj){
	obj = time(obj);
	if(history.push(obj)>=100)history.shift();
	for(var i=0,l=clients.length;i<l;i++)send(clients[i],obj);
}
function search(user){
	for(var i=0,l=clients.length;i<l;i++){
		if(clients[i].username == user)return clients[i];
	}
	return false;
}
function cap(str){
	return str.slice(0,1).toUpperCase() + str.slice(1);
}
function time(obj){
	obj.time = (new Date).getTime();
	return obj;
}
function send(con,obj){
	con.sendUTF(JSON.stringify(obj));
}
console.log("Reached end of index.js");
