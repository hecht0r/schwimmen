const game = require('./game.js');

module.exports = class Match{
	constructor(id) {
		this.players = [];
		this.games = [];
		this.status = 0;
		this.id = id;
		this.maxPlayers = 4; //default
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

	start(){
		// start game
 		this.status = 1;
		let scoreBoard =[];
		for (let i = 0; i < m.players.length; i++) {
			scoreBoard.push({player: m.players[i].name, score: m.players[i].score, wins: m.players[i].wins});
		}
		m.emitPlayers('updateScoreboard',scoreBoard);

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