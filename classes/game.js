const helper = require('./../helpers.js'); 
const deck = require('./deck.js');
const action = require('./../actions.js');

module.exports = class Game{
    constructor(players) {
		this.players = players.slice();
		this.shoveCount = 0;
		this.knockCount = 0;
		this.moveCount = 0;
	}
	
	getNextPlayer(player) {
		let index = this.players.indexOf(player);
		if (index == this.players.length-1){
			index = -1;
		}
		return this.players[index + 1];
	}

	emitPlayers(event, data) {
		for (let i = 0; i < this.players.length; i++) {
			this.players[i].emit(event, data);
		}
	}
    
	start(starter) {
		// start game, create deck and deal cards
		let m = helper.findMatchBySocketId(starter.socket.id);
		helper.log('---');
		helper.log(starter.socket.username + ' beginnt.')
		this.emitPlayers('newGame',starter.socket.username);
		this.starter = starter;
		this.deck = new deck();
		this.deck.createDeck();
		this.deck.shuffleDeck();

		// hand out cards and tell the players' client
		for (let i = 0; i < this.players.length; i++) {
			let player = this.players[i];
			player.hand = this.deck.cards.splice(0,3);
			player.handValue = helper.handValue(player.hand);
			player.emit('updateHand', player.hand);
		}

		// check if someone has already >= 31 handvalue
		for (let i = 0; i < this.players.length; i++) {
			let player = this.players[i];
			if (player.handValue >= 31){
				this.end(player);
			}
		}
		this.starter.emit('yourStartTurn');
	}

	async end(winner){
		let m = helper.findMatchBySocketId(winner.socket.id);

		m.emitPlayers('roundOver');
		
		// tell scores to everyone
		for (let i = 0; i < this.players.length; i++) {
			m.emitPlayers('results',{player: this.players[i].name, score: this.players[i].handValue});
			helper.log(this.players[i].name + ': ' + this.players[i].handValue);
		}

		// find and tell losers to everyone
		let losers;
		if (winner.handValue === 33){
			losers = this.players.filter(p => (p != winner));
		}else{
			let players = this.players.slice();
			players.sort((a,b) => (a.handValue > b.handValue) ? 1 : ((b.handValue > a.handValue) ? -1 : 0)); 
			losers = this.players.filter(p => (p.handValue === players[0].handValue));
		}

		let playerLength = this.players.length;
		for (let i = 0; i < losers.length; i++) {
			let loser = losers[i];
			loser.score -= 1;
			helper.log(`${loser.name} verliert!`);
			m.emitPlayers('losers', loser.name);
			
			// check if players swim
			if (loser.score === 0){
				m.emitPlayers('swim', loser.name);
			}
			
			// check if players have to leave the game, not if losers are the only active players
			if (loser.score < 0){
				if (losers.length === playerLength){
					loser.score++;
				}else{
					loser.score = '†';
					m.emitPlayers('out', loser.name);
					let index = this.players.indexOf(loser);
					if (index > -1) {
						this.players.splice(index, 1);
					}
				}				
			}
		}
	
		let scoreBoard =[];
		for (let i = 0; i < m.players.length; i++) {
			scoreBoard.push({player: m.players[i].name, score: m.players[i].score, wins: m.players[i].wins});
			helper.log(m.players[i].name + ': ' + m.players[i].score);
		}

		let players;
		let timeout = 10000;
		if (this.players.length === 1){
			m.emitPlayers('winner',this.players[0].name)
			players = m.players;
			let winnerIndex = players.indexOf(this.players[0]);
			players[winnerIndex].wins++;
			for (let i = 0; i < players.length; i++) {
				players[i].init();
			}
			await new Promise(r => setTimeout(r, timeout));
			timeout = 0;
			m.emitPlayers('gameOver');
		}else{
			players = this.players;
		}
		
		scoreBoard =[];
		for (let i = 0; i < m.players.length; i++) {
			scoreBoard.push({player: m.players[i].name, score: m.players[i].score, wins: m.players[i].wins});
			helper.log(m.players[i].name + ': ' + m.players[i].score);
		}

		let nextStarter = this.getNextPlayer(this.starter);	

		m.emitPlayers('updateScoreboard',scoreBoard);

		setTimeout(function() {
			m.startGame(players, nextStarter);
		}, timeout);
	}
}	