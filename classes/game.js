const helper = require('./../helpers.js'); 
const deck = require('./deck.js');
const round = require('./round.js');

module.exports = class Game{
    constructor() {
		this.rounds = [];
		this.winner;
    }
    
	start(starter) {
		// start game, create deck and draw trumpcard
		let m = helper.findMatchBySocketId(starter.socket.id);
		console.log(starter.socket.username + ' beginnt.')
		m.emitPlayers('newGame',starter.socket.username);
		this.starter = starter;
		this.deck = new deck();
		this.deck.createDeck();
		this.deck.shuffleDeck();
		this.trumpcard = this.deck.cards.slice(-1)[0];
				
		for (let i = 0; i < m.teams.length; i++) {
			m.teams[i].init();
		}

		// hand out cards and tell the players' client	
		for (let i = 0; i < m.players.length; i++) {
			m.players[i].init();
			m.players[i].hand = this.deck.cards.splice(0,5);
			m.players[i].emit('updateHand', m.players[i].hand);
			m.players[i].emit('updateTrumpcard', {trumpcard: this.trumpcard});
		}
	
		// start first round
		let r = new round.FirstRound(this.starter);
		this.rounds.push(r);
		r.start();		
	}
	
	getCurrentRound() {
		return this.rounds[this.rounds.length - 1];
	}

	checkGigackel(){
		let m = helper.findMatchByTeam(this.winner);
		if (m.teams.filter(team => team.wonCards.length > 0).length === 1){
			return true;
		}
		return false;
	}

	end(winnerTeam){
		// increase winners wincount, tell everyone and start new game
		
		let m = helper.findMatchByTeam(winnerTeam);
		this.winner = winnerTeam;
		
		if(this.checkGigackel()){
			winnerTeam.wins += 2;
			console.log(`${winnerTeam.name} gewinnt!`);
			m.emitPlayers('gameOver', {winner: winnerTeam.name, gigackel: true});
		}else{
			winnerTeam.wins += 1;
			console.log(`${winnerTeam.name} gewinnt!`);
			m.emitPlayers('gameOver', {winner: winnerTeam.name, gigackel: false});		
		};		
		
		let scoreBoard =[];

		for (let i = 0; i < m.teams.length; i++) {
			scoreBoard.push({team: m.teams[i].name, score: m.teams[i].wins});
		}

		m.emitPlayers('updateScoreboard',scoreBoard);
		let starter = this.starter;
		setTimeout(function() {
			m.startGame(m.getNextPlayer(starter));
		}, 5000);
	}

}	