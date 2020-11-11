const helper = require('../helpers.js');
const game = require('./game.js');

module.exports = class Match{
	constructor(id) {
		this.players = [];
		this.games = [];
		this.id = id;
		this.settings = {autoShoveAfter: 60, maxPlayers: 8};
	}
	
	addPlayer(player){
		let players = this.players.slice();
		// new players start with the lowest score 
		if(players.length > 0){
			players.sort((a,b) => (a.score > b.score) ? 1 : ((b.score > a.score) ? -1 : 0)); 
			player.score = players[0].score;
		}	
		this.players.push(player);
	}

	start(){
		for (let i = 0; i < this.getNumPlayers(); i++) {
			this.players[i].init();
		}

		// for first game randomly pick starting player
		this.startGame(this.players, this.players[Math.floor(Math.random() * this.players.length)]);
	}

	startGame(players, starter) {
		let g = new game(players);
		this.games.push(g);
		g.start(starter);	
	}
	
	setSettings(settings){
		this.settings = settings;
	}

	getCurrentGame() {
		return this.games[this.games.length - 1];
	}

	getStatus() {
		let status;
		if (this.games.length > 0){
			status = 'running';
		}else{
			status = 'waiting';
		}
		return status;
	}

	getNumPlayers() {
		return this.players.length;
	}

	isNotFull() {
		return (this.getNumPlayers() < this.settings.maxPlayers);
	}

	emitPlayers(event, data) {
		for (let i = 0; i < this.getNumPlayers(); i++) {
			this.players[i].emit(event, data);
		}
	};

	findPlayerById(socketId){
		for (let i = 0; i < this.getNumPlayers(); i++) {
			if (this.players[i].socket.id === socketId) {
				return this.players[i];
			}
		}
		return false;
	}

	getScoreboard(){
		let scoreBoard =[];
		for (let i = 0; i < this.getNumPlayers(); i++) {
			scoreBoard.push({player: this.players[i].socket.username, score: this.players[i].score, wins: this.players[i].wins});
		}
		return scoreBoard;
	}
}