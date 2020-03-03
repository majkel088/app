var express = require('express'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	port = process.env.PORT || 3000,
	backlog = {},
	rooms = {};
	var usersList = [];
var ip = require("ip");
var getIP = ip.address() ;

app.use(express.static('public'));


io.on('connection', function(socket){
	var username = undefined,
		room = undefined;

	function leave() {
		if(room && username) {
			for (var i = 0; i < rooms[room].users.length; i++) {
				if(rooms[room].users[i] === username) {
					rooms[room].users.splice(i, 1);
					updateClients();
					if(rooms[room].users.length === 0) delete rooms[room];
					break;
				}
			};
			io.to(room).emit('msg', {
				name: "Serwer",
				room: room,
				msg: username + " opuścił pokój."
			});

		}
	}

	socket.on('disconnect', function(){
		socket.leave(room);
		leave();
	});

	socket.on('join-room', function(msg){
		username = msg.name;
		room = msg.room;

		if(!rooms[msg.room]) rooms[msg.room] = {users: [msg.name], backlog: []};
		else {
			rooms[msg.room].users.push(username);
		}
		msg.name = "Serwer";
		io.to(msg.room).emit('msg', msg);
		socket.join(msg.room);
		updateClients();
	});

	function updateClients() {
		io.to(room).emit('update', rooms[room].users);
	};

	socket.on('history', function() {
		for (var i = 0; i < rooms[room].backlog.length; i++) {
			socket.emit('msg', rooms[room].backlog[i]);
		};
	});

  socket.on('msg', function(msg) {
  	rooms[msg.room].backlog.push(msg);
  	io.to(msg.room).emit('msg', msg);
	})
	
});

http.listen(port,'0.0.0.0', function(){
	console.log('Adres strony');
	console.dir(getIP + ":" + port);
});
