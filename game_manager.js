const socketio = require('socket.io');
const player = require('./classes/player.js');
const helper = require('./helpers.js');
const actions = require('./actions.js');
const match = require('./classes/match.js');
const deck = require('./classes/deck.js');

global.log = true;
global.rooms = [];
global.score_to_win = 101;

module.exports.listen = function(app) {
	io = socketio.listen(app);
	io.on('connection', function(socket) {
 
		socket.on('setUsername', function(data) {
			helper.log(`${data} connected`);
			join(socket, data);
		});
		
		socket.on('action', function(data) {
			switch (data.action) {
				case 'keep':
					actions.keep(socket, data);
					break;
				case 'new':
					actions.new(socket, data);
					break;
				case 'change':
					actions.change(socket, data);
					break;
				case 'changeAll':
					actions.changeAll(socket, data);
					break;			
				case 'shove':
					actions.shove(socket, data);
					break;
				case 'knock':
					actions.knock(socket, data);
					break;
			}
		});	

		socket.on('settings', function(data) {
			helper.findMatchById(data.matchId).setMaxPlayers(data.maxPlayers);
		});	

		socket.on('disconnect', function () {
			// if our player was part of a match, we kick him from players
			let m = helper.findMatchBySocketId(socket.id);
			if (m){
				//m.kickPlayer(m.players.indexOf(m.findPlayerById(socket.id)),1);
				m.players.splice(m.players.indexOf(m.findPlayerById(socket.id)),1);
				m.emitPlayers('playerDisconnected', socket.username);
				// delete match if he was its last player, if not, start a new game
				if (m.players.length == 0){
					rooms.splice(rooms.indexOf(m),1);
				}else{
					m.startGame(m.players, m.players[Math.floor(Math.random() * m.players.length)]);
				}
			};
			helper.log(`${socket.username} disconnected`);
		});
	});
	return io;
}

function join(socket, username) {
	socket.username = username;

	// if there is no match waiting create a new one
	if (!helper.getMatchWaitingForPlayers()) {
		m = new match(helper.createUniqueID());
		rooms.push(m);
	} else {
		m = helper.getMatchWaitingForPlayers();
	}

	let p = new player(socket);
	m.addPlayer(p);
	p.emit('userSet', {username: username, matchId: m.id});

	// first player sets maxPlayers
	if (m.players.length === 1){
		p.emit('setSettings');
	}
	
	setTimeout(function() {
		if (m.maxPlayers){
			m.emitPlayers('userJoined', {username: username, count: m.players.length + '/' + m.maxPlayers + ' Spieler'});
		}else{
			m.emitPlayers('userJoined', {username: username, count: m.players.length + ' Spieler'});
		}	
	}, 1000);

	if (m.players.length == m.maxPlayers) {
		setTimeout(function() {
			m.start();
		}, 2000);
	}
}