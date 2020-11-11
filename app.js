// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const port = process.env.PORT || 3001;
const io = require('./game_manager').listen(server);  // Start Socket.io server and let game_manager handle those connections
const match = require('./classes/match.js');
const helper = require('./helpers.js');

// Routing
app.use(express.static(path.join(__dirname, 'public')));

server.listen(port, function() {
	helper.log('listening on localhost:' + port);
});

app.get('/matches', function(req, res) {
	let content = '';
	content += '<h1>Offene Spiele</h1>';
	content += '<ul>';

	for (let i = 0; i < rooms.length; i++) {
		content += '<li>Spieler: ' + rooms[i].players.length + ' (' + rooms[i].getStatus() + ')</li>';
		content += '<ul>';
		for (let j = 0; j < rooms[i].players.length; j++) {
			content += '<li>' + rooms[i].players[j].socket.username + ': ' + rooms[i].players[j].score + ' (' + rooms[i].players[j].wins + ')</li>';
		}
		content += '</ul>';
	}
	content += '</ul>';

	res.send(content);
});