const game = require('./game.js');
const team = require('./team.js');

module.exports = class Match{
	constructor(id) {
		this.players = [];
		this.teams = [];
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
		// create teams and assign players
		this.teams = [];
		let t;
		if(this.players.length == 4){
			t = new team();
			t.addPlayer({name: this.players[0].socket.username, id: this.players[0].socket.id});
			t.addPlayer({name: this.players[2].socket.username, id: this.players[2].socket.id});
			t.setName();
			this.teams.push(t);	

			t = new team();
			t.addPlayer({name: this.players[1].socket.username, id: this.players[1].socket.id});
			t.addPlayer({name: this.players[3].socket.username, id: this.players[3].socket.id});
			t.setName();
			this.teams.push(t);	
		}else{
			for (let i = 0; i < this.players.length; i++) {
				t = new team();
				t.addPlayer({name: this.players[i].socket.username, id: this.players[i].socket.id});
				t.setName();
				this.teams.push(t);
			}
		}

		// start game
		this.status = 1;
		let scoreBoard =[];
		for (let i = 0; i < this.teams.length; i++) {
			this.teams[i].wins = 0;
			scoreBoard.push({team: this.teams[i].name, score: this.teams[i].wins});
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

	findTeamById(socketId){
		for (let i = 0; i < this.teams.length; i++) {
			for (let j = 0; j < this.teams[i].players.length; j++) {
				if (this.teams[i].players[j].id === socketId) {
					return this.teams[i];
				}
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