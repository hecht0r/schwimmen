const socketio = require('socket.io');
const player = require('./classes/player.js');
const helper = require('./helpers.js');
const actions = require('./actions.js');
const match = require('./classes/match.js');

global.rooms = [];
global.score_to_win = 101;

module.exports.listen = function(app) {
	io = socketio.listen(app);
	io.on('connection', function(socket) {

		socket.on('setUsername', function(data) {
			console.log(`${data} connected`);
			join(socket, data);
		});
		
		socket.on('action', function(data) {
			action(socket, data);
		});	

		socket.on('settings', function(data) {
			helper.findMatchById(data.matchId).setMaxPlayers(data.maxPlayers);
		});	

		socket.on('disconnect', function () {
			// if our player was part of a match, we kick him from players
			let m = helper.findMatchBySocketId(socket.id);
			if (m){
				m.players.splice(m.players.indexOf(m.findPlayerById(socket.id)),1);
				m.emitPlayers('playerDisconnected', socket.username);
				m.status = 0;
				// delete match if he was its last player
				if (m.players.length == 0){
					rooms.splice(rooms.indexOf(m),1);
				}
				
			};
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

function action(socket, data) {
	switch (data.action) {
		case 'playCard':
			actions.playCard(socket, data);
			break;
		case 'melding':
			actions.melding(socket, data);
			break;			
		case 'getTrumpcard':
			actions.getTrumpcard(socket, data);
			break;
		case 'forfeit':
			actions.forfeit(socket, data);
			break;
		case 'higher':
			actions.higher(socket, data);
			break;
		case 'secondAce':
			actions.secondAce(socket, data);
			break;
		case 'startOpen':
			actions.startOpen(socket, data);
			break;
		case 'playCardLast':
			actions.playCardLast(socket, data);
			break;
	}
}