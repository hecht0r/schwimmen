const game = require('./game.js');

module.exports = class Match{
	constructor(id) {
		this.players = [];
		this.games = [];
		this.status = 0;
		this.id = id;
		this.maxPlayers = 4;
	}
	
	addPlayer(player){
		this.players.push(player);
	}

	setMaxPlayers(max){
		if (max < 2){
			this.maxPlayers = 2;	
		}else if (max > 4){
			this.maxPlayers = 4;
		}else{
			this.maxPlayers = max;
		}
	}

	start(){
		this.status = 1;
		let scoreBoard =[];
		for (let i = 0; i < this.players.length; i++) {
			this.players[i].wins = 0;
			scoreBoard.push({player: this.players[i].socket.username, score: this.players[i].wins});
		}
		m.emitPlayers('updateScoreboard',scoreBoard);
		this.startGame(this.players[Math.floor(Math.random() * this.players.length)]);
	}

	startGame(starter) {
		let g = new game();
		this.games.push(g);
		g.start(starter);	
	}
	
	getCurrentGame() {
		return this.games[this.games.length - 1];
	}

	isWaiting() {
		return this.status === 0;
	};

	emitPlayers(event, data) {
		for (let i = 0; i < this.players.length; i++) {
			this.players[i].emit(event, data);
		}
	};

	findPlayerById(socketId){
		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i].socket.id === socketId) {
				return this.players[i];
			}
		}
		return false;
	}

	getNextPlayer(player) {
		let index = this.players.indexOf(player);
		if (index == this.players.length-1){
			index = -1;
		}
		return this.players[index + 1];
	}
 }

 module.exports.matchStatus = ['Warte auf Spieler', 'Spiel läuft'];