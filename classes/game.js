const helper = require('./../helpers.js'); 
const deck = require('./deck.js');
const round = require('./round.js');

module.exports = class Game{
    constructor() {
		this.rounds = [];
		this.winner;
    }
    
	start(starter) {
		let m = helper.findMatchBySocketId(starter.socket.id);
		console.log(starter.socket.username + ' beginnt.')
		m.emitPlayers('newGame',starter.socket.username);
		this.starter = starter;
		this.deck = new deck();
		this.deck.createDeck();
		this.deck.shuffleDeck();
		this.trumpcard = this.deck.cards.slice(-1)[0];
				
		for (let i = 0; i < m.players.length; i++) {
			m.players[i].init();
			m.players[i].hand = this.deck.cards.splice(0,5);
			m.players[i].emit('updateHand', m.players[i].hand);
			m.players[i].emit('updateTrumpcard', {trumpcard: this.trumpcard});
 		}
		let r = new round.FirstRound(this.starter);
		this.rounds.push(r);
		r.start();		
	}
	
	getCurrentRound() {
		return this.rounds[this.rounds.length - 1];
	}

	checkGigackel(){
		if (m.players.filter(player => player.wonCards.length > 0).length === 1){
			return true;
		}
		return false;
	}

	end(winner){
		let m = helper.findMatchBySocketId(winner.socket.id);
		this.winner = winner;
		
		if(this.checkGigackel()){
			this.winner.wins += 2;
			console.log(`${winner.socket.username} gewinnt!`);
			m.emitPlayers('gameOver', {winner: winner.socket.username, gigackel: true});
		}else{
			this.winner.wins += 1;
			console.log(`${winner.socket.username} gewinnt!`);
			m.emitPlayers('gameOver', {winner: winner.socket.username, gigackel: false});		
		};		
		
		let scoreBoard =[];
		for (let i = 0; i < m.players.length; i++) {
			scoreBoard.push({player: m.players[i].socket.username, score: m.players[i].wins});
		}
		m.emitPlayers('updateScoreboard',scoreBoard);
		let starter = this.starter;
		setTimeout(function() {
			m.startGame(m.getNextPlayer(starter));
		}, 5000);
	}

}	