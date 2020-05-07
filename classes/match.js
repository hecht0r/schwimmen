const game = require('./game.js');

module.exports = class Match{
	constructor(players) {
		this.players = players;
		this.games = [];	

		let scoreBoard =[];
		for (let i = 0; i < this.players.length; i++) {
			players[i].wins = 0;
			scoreBoard.push({player: this.players[i].socket.username, score: this.players[i].wins});
		}
		io.sockets.emit('updateScoreboard',scoreBoard);

	}
	
	startGame(starter) {
		let g = new game();
		this.games.push(g);
		g.start(starter);	
	}
	
	getCurrentGame() {
		return this.games[this.games.length - 1];
	}
 }