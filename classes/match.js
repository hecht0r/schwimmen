const game = require('./game.js');

module.exports = class Match{
	constructor(players) {
		this.players = players;
		this.games = [];	

		let scoreBoard =[];
		for (let i = 0; i < players.length; i++) {
			scoreBoard.push({player: players[i].playerName, score: players[i].wins});
		}
		io.sockets.emit('updateScoreboard',scoreBoard);

	}
	
	startGame() {
		let g = new game(players);
		this.games.push(g);
		g.start(this.players[Math.floor(Math.random() * this.players.length)]);	
	}
	
	getCurrentGame() {
		return this.games[this.games.length - 1];
	}
 }