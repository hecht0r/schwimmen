const game = require('./game.js');

class Match{
	constructor(players) {
		this.players = players;
		this.games = [];	
	}
	
	startGame() {
		let g = new game(players);
		this.games.push(g);
		g.start();	
	}
	
	getCurrentGame() {
		return this.games[this.games.length - 1];
	}
 }


module.exports = Match;
