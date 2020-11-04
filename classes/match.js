const game = require('./game.js');

module.exports = class Match{
	constructor(id) {
		this.players = [];
		this.games = [];
		this.status = 0;
		this.id = id;
		this.maxPlayers;
	}
	
	addPlayer(player){
		this.players.push(player);
	}

	setMaxPlayers(max){
		if (max < 2){
			this.maxPlayers = 2;	
		}else if (max > 9){
			this.maxPlayers = 9;
		}else{
			this.maxPlayers = max;
		}
	}

	kickPlayer(player){
		this.players.splice(player, 1);

		let scoreBoard =[];
		for (let i = 0; i < this.players.length; i++) {
			scoreBoard.push({player: this.players[i].name, score: this.players[i].score, wins: this.players[i].wins});
		}
		this.emitPlayers('updateScoreboard',scoreBoard);

		// for next game randomly pick starting player
		this.startGame(this.players, this.players[Math.floor(Math.random() * this.players.length)]);
	}

	start(){
		// start game
 		this.status = 1;
		let scoreBoard =[];
		for (let i = 0; i < this.players.length; i++) {
			this.players[i].init();
			scoreBoard.push({player: this.players[i].name, score: this.players[i].score, wins: this.players[i].wins});
		}
		this.emitPlayers('updateScoreboard',scoreBoard);

		// for first game randomly pick starting player
		this.startGame(this.players, this.players[Math.floor(Math.random() * this.players.length)]);
	}

	startGame(players, starter) {
		let g = new game(players);
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
 }

 module.exports.matchStatus = ['Warte auf Spieler', 'Spiel läuft'];