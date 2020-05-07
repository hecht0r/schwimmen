const deck = require('./deck.js');
const round = require('./round.js');

class Game{
    constructor() {
		this.rounds = [];
		this.winner;
    }
    
	start(starter) {
		io.sockets.emit('newGame',starter.socket.username);
		this.starter = starter;
		this.deck = new deck();
		this.deck.createDeck();
		this.deck.shuffleDeck();
		this.trumpcard = this.deck.cards.slice(-1)[0];
				
		for (let i = 0; i < m.players.length; i++) {
			m.players[i].init();
			m.players[i].hand = this.deck.cards.splice(0,5);
			m.players[i].socket.emit('updateHand', m.players[i].hand);
			m.players[i].socket.emit('updateTrumpcard', {trumpcard: this.trumpcard});
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