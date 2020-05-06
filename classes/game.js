const deck = require('./deck.js');
const round = require('./round.js');

class Game{
    constructor(players) {
		this.players = players;
		this.rounds = [];
		this.winner;
    }
    
	start(starter) {
		io.sockets.emit('newGame',starter.playerName);
		this.starter = starter;
		this.deck = new deck();
		this.deck.createDeck();
		this.deck.shuffleDeck();
		this.trumpcard = this.deck.cards.slice(-1)[0];
				
		for (let i = 0; i < this.players.length; i++) {
			this.players[i].init();
			this.players[i].hand = this.deck.cards.splice(0,5);
			this.players[i].socket.emit('updateHand', this.players[i].hand);
			this.players[i].socket.emit('updateTrumpcard', {trumpcard: this.trumpcard});
 		}
		let r = new round.FirstRound(this.starter);
		this.rounds.push(r);
		r.start();		
	}
	
	getCurrentRound() {
		return this.rounds[this.rounds.length - 1];
	}
}	

module.exports = Game;