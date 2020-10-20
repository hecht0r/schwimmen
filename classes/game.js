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
		console.log(starter.socket.username + ' beginnt.')
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

	end(winner){
		let m = helper.findMatchBySocketId(winner.socket.id);
		
		// tell scores to everyone
		for (let i = 0; i < this.players.length; i++) {
			m.emitPlayers('results',{player: this.players[i].name, score: this.players[i].handValue});
		}

		// find and tell losers to everyone
		let losers;
		if (winner.handValue === 33){
			losers = this.players.filter(p => (p != winner));
		}else{
			let players = this.players.slice();
			players.sort((a,b) => (a.handValue > b.handValue) ? 1 : ((b.handValue > a.handValue) ? -1 : 0)); 
			losers = m.players.filter(p => (p.handValue === players[0].handValue));
		}

		for (let i = 0; i < losers.length; i++) {
			losers[i].score -= 1;
			console.log(`${losers[i].name} verliert!`);
			m.emitPlayers('losers', losers[i].name);
			
			// check if players swim
			if (losers[i].score === 0){
				m.emitPlayers('swim', losers[i].name);
			}
			
			// check if players have to leave the game
			if (losers[i].score < 0){
				m.emitPlayers('out', losers[i].name);
				let index = this.players.indexOf(losers[i]);
				if (index > -1) {
					this.players.splice(index, 1);
				}				
			}
		}
	
		let scoreBoard =[];
		for (let i = 0; i < m.players.length; i++) {
			scoreBoard.push({player: m.players[i].name, score: m.players[i].score});
		}

		let nextStarter = this.getNextPlayer(this.starter);	
		let players = this.players;
		m.emitPlayers('updateScoreboard',scoreBoard);
		setTimeout(function() {
			m.startGame(players, nextStarter);
		}, 5000);
	}
}	