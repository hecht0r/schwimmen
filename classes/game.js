const deck = require('./deck.js');
const round = require('./round.js');

class Game{
    constructor(players) {
		this.players = players;
		this.rounds = [];
		this.maxrounds = (48 - this.players.length * 5) / this.players.length;
    }
    
	start() {
		io.sockets.emit('newGame');
		this.deck = new deck();
		this.deck.createDeck();
		this.deck.shuffleDeck();
		this.trumpcard = this.deck.cards.slice(-1)[0];
		for (let i = 0; i < this.players.length; i++) {
			this.players[i].hand = this.deck.cards.splice(0,5);
			this.players[i].socket.emit('updateHand', this.players[i].hand);
			this.players[i].socket.emit('updateTrumpcard', this.trumpcard);
 		}
		//let r = new round.FirstRound(players, this.players[Math.floor(Math.random() * this.players.length)]);
		let r = new round.Round(players, this.players[Math.floor(Math.random() * this.players.length)]);
		this.rounds.push(r);
		r.start();		
		
		/*
		for (let i = 0; i < this.maxrounds; i++) {
			if (i===0) {
				this.rounds.push( new round.FirstRound(players, this.trumpcard));
			}else{
				this.rounds.push( new round.Round(players));
			}
			
			this.rounds[0].startRound();
		}
		
		for (let i = 0; i<5; i++) {
			this.rounds.push( new round.LastRound(players));
			for (let i = 0; i < this.players.length; i++) {
				this.players[i].playerCards.splice(0,1);
			}	
		}
		*/
	}
	
	getCurrentRound() {
		return this.rounds[this.rounds.length - 1];
	}
}	

module.exports = Game;