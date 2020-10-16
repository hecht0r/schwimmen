const helper = require('./../helpers.js'); 
const action = require('./../actions.js'); 

class Round {
	constructor(starter) {
		this.starter = starter;
		this.cardsPlayed = [];  
	}	

	replayGame(){
		let m = helper.findMatchBySocketId(this.starter.socket.id);
		m.emitPlayers('restart');
		let starter = m.getCurrentGame().starter;
		setTimeout(function() {
			starter.emit('startGame');
			m.startGame(starter);
		}, 5000);
	}

}

class FirstRound extends Round {
	
	constructor(starter) {
		super(starter);
		this.action;
	}	
	
	start() {
		this.starter.emit('startGame');
	}	

	end(){
		let m = helper.findMatchBySocketId(this.starter.socket.id);
		// first show all cards
		let cards = [];
		for (let i = 0; i < this.cardsPlayed.length; i++){
			cards.push({player: this.cardsPlayed[i].player.socket.username,
						card:  this.cardsPlayed[i].card});
		}
		m.emitPlayers('showCards', cards);
		
		let cardsFiltered;
		let winner;
		let c = [];
		switch(this.action){
			case 'higher':
				// remove all cards other playedSuit
				cardsFiltered = this.cardsPlayed.filter(c => (c.card.suit == this.cardsPlayed[0].card.suit));

				// remove all duplicates
				cardsFiltered = cardsFiltered.reduce((arr, item) => {
					let exists = !!arr.find(c => c.card.id === item.card.id);
					if(!exists){
						arr.push(item);
					}
					return arr;
				}, []);
				
				// highest value wins	
				for (let i = 0; i < cardsFiltered.length; i++){
					c.push({player: cardsFiltered[i].player, value: cardsFiltered[i].card.value});
				}
				c.sort(function(a, b){return b.value-a.value});
				winner = c[0].player;
				break;

			case 'secondAce':
				// check if someone played the same card as first player
				cardsFiltered = this.cardsPlayed.slice(1).filter(c => ( c.card.id == this.cardsPlayed[0].card.id));
				if(cardsFiltered.length > 0){
					winner = cardsFiltered[0].player;
				}else{
					winner = this.cardsPlayed[0].player;
				}
				break;

			case 'startOpen':
				// remove all cards other than trump or playedSuit
				cardsFiltered = this.cardsPlayed.filter(c => ( c.card.suit == this.cardsPlayed[0].card.suit || 
															   c.card.suit == m.getCurrentGame().trumpcard.suit ));
		
				// remove all duplicates
				cardsFiltered = cardsFiltered.reduce((arr, item) => {
					let exists = !!arr.find(c => c.card.id === item.card.id);
					if(!exists){
						arr.push(item);
					}
					return arr;
				}, []);
						
				// trump value is higher
				for (let i = 0; i < cardsFiltered.length; i++) {
					let value = cardsFiltered[i].card.value;
					if (cardsFiltered[i].card.suit == m.getCurrentGame().trumpcard.suit) {
						value = value + 12;
					};
					c.push({player: cardsFiltered[i].player, value: value});
				}	
				
				// highest value wins	
				c.sort(function(a, b){return b.value-a.value});
				winner = c[0].player;
				break;
				
		}
		
		// update winners score 
		let total = helper.getCardsValue(this.cardsPlayed);
		console.log(winner.socket.username + ' gets ' + total + ' points!');
		let winnerTeam = m.findTeamById(winner.socket.id);

		winnerTeam.score += total;
		winnerTeam.emitPlayers('updateScore', winnerTeam.score);

		for (let i = 0; i < this.cardsPlayed.length; i++) {
			winnerTeam.wonCards.push(this.cardsPlayed[i].card);	
		}

		m.emitPlayers('roundOver',winner.socket.username);
		
		setTimeout(function() {
			// draw Card, first winner
			winner.hand.push(m.getCurrentGame().deck.drawCard());	
			winner.emit('updateHand', winner.hand);	
			// now everybody else in correct order
			let player = m.getNextPlayer(winner);
			for (let i = 1; i < m.players.length; i++) {
				player.hand.push(m.getCurrentGame().deck.drawCard());	
				player.emit('updateHand', player.hand);	
				player = m.getNextPlayer(player);
			}	
			// start new round		
			//let r = new RegularRound(winner);
			let r = new FinalRound(winner);
			m.getCurrentGame().rounds.push(r);
			r.start();	
		}, 5000);
	}
}	


class RegularRound extends Round {
	constructor(starter) {
		super(starter);
	}	
	
	start() {
		let m = helper.findMatchBySocketId(this.starter.socket.id);
		this.starter.emit('yourTurn');
		m.emitPlayers('newRound', m.getCurrentGame().deck.cards.length);	
		m.emitPlayers('nextPlayer', this.starter.socket.username)	
		// tell the clients if they can meld
		for (let i = 0; i < m.players.length; i++) {
			if (action.checkMelding(m.players[i].hand)){
				m.players[i].emit('melding');
			}
		}
	}		

	end() {
		let m = helper.findMatchBySocketId(this.starter.socket.id);
		// remove all cards other than trump or playedSuit
		let cardsFiltered = this.cardsPlayed.filter(c => ( c.card.suit == this.cardsPlayed[0].card.suit || 
														   c.card.suit == m.getCurrentGame().trumpcard.suit ));

		// remove all duplicates
		cardsFiltered = cardsFiltered.reduce((arr, item) => {
			let exists = !!arr.find(c => c.card.id === item.card.id);
			if(!exists){
				arr.push(item);
			}
			return arr;
		}, []);
				
		// trump value is higher
		let c = [];
		for (let i = 0; i < cardsFiltered.length; i++) {
			let value = cardsFiltered[i].card.value;
			if (cardsFiltered[i].card.suit == m.getCurrentGame().trumpcard.suit) {
				value = value + 12;
			};
			c.push({player: cardsFiltered[i].player, value: value});
		}	
		
		// highest value wins	
		c.sort(function(a, b){return b.value-a.value});
		let winner = c[0].player;
 		let total = helper.getCardsValue(this.cardsPlayed);
		console.log(winner.socket.username + ' gets ' + total + ' points!');
		
		let winnerTeam = m.findTeamById(winner.socket.id);
		
		winnerTeam.score += total;
		winnerTeam.emitPlayers('updateScore', winnerTeam.score);
		
		for (let i = 0; i < this.cardsPlayed.length; i++) {
			winnerTeam.wonCards.push(this.cardsPlayed[i].card);	
		}
		
		m.emitPlayers('roundOver',winner.socket.username);
		if (winnerTeam.score >= score_to_win) {
			m.getCurrentGame().end(winnerTeam);
		}else{
			setTimeout(function() {
				// draw Card, first winner
				winner.hand.push(m.getCurrentGame().deck.drawCard());	
				winner.emit('updateHand', winner.hand);	
				
				// now everybody else in correct order
				let player = m.getNextPlayer(winner);
				for (let i = 1; i < m.players.length; i++) {
					player.hand.push(m.getCurrentGame().deck.drawCard());	
					player.emit('updateHand', player.hand);	
					player = m.getNextPlayer(player);
				}
			
				// start new round		
				let r;
				if (m.getCurrentGame().deck.cards.length > 0){
					r = new RegularRound(winner);
				}else{
					r = new FinalRound(winner);
				}
				m.getCurrentGame().rounds.push(r);
				r.start();		
			}, 3000);
		}	
	}
}	


class FinalRound extends Round {
	constructor(starter) {
		super(starter);
		
	}	
	
	start() {
		let m = helper.findMatchBySocketId(this.starter.socket.id);
		this.starter.emit('yourTurnLast');
		m.emitPlayers('newRound', '0');	
		m.emitPlayers('nextPlayer', this.starter.socket.username)	
		m.emitPlayers('lastRounds', m.getCurrentGame().trumpcard.suit);
	}	
	
	end(){
		let m = helper.findMatchBySocketId(this.starter.socket.id);
		// remove all cards other than trump or playedSuit
		let cardsFiltered = this.cardsPlayed.filter(c => ( c.card.suit == this.cardsPlayed[0].card.suit || 
													       c.card.suit == m.getCurrentGame().trumpcard.suit ));
	
		// remove all duplicates
		cardsFiltered = cardsFiltered.reduce((arr, item) => {
			let exists = !!arr.find(c => c.card.id === item.card.id);
			if(!exists){
				arr.push(item);
			}
			return arr;
		}, []);

		// trump value is higher 
		let c = [];
		for (let i = 0; i < cardsFiltered.length; i++) {
			let value = cardsFiltered[i].card.value;
			if (cardsFiltered[i].card.suit == m.getCurrentGame().trumpcard.suit) {
				value = value + 12; // 12 because trump7 beats non-trump ace
			};
			c.push({player: cardsFiltered[i].player, value: value});
		}	
		
		// highest value wins	
		c.sort(function(a, b){return b.value-a.value});
		let winner = c[0].player;
		let total = helper.getCardsValue(this.cardsPlayed);
		console.log(winner.socket.username + ' gets ' + total + ' points!');

		let winnerTeam = m.findTeamById(winner.socket.id);
		winnerTeam.score += total;
		winnerTeam.emitPlayers('updateScore', winnerTeam.score);
		
		for (let i = 0; i < this.cardsPlayed.length; i++) {
			winnerTeam.wonCards.push(this.cardsPlayed[i].card);	
		}

		m.emitPlayers('roundOver',winner.socket.username);

		if (winnerTeam.score >= score_to_win) {
			m.getCurrentGame().end(winnerTeam);
		}else{
			if(winner.hand.length == 0){
				// no more cards, team/player with most points wins
				let teams = m.teams;
				teams.sort((a, b) => (a.score < b.score) ? 1 : -1)
				m.getCurrentGame().end(teams[0]);
			}else{
				setTimeout(function() {
					// start new round		
					let r = new FinalRound(winner);
					m.getCurrentGame().rounds.push(r);					
					r.start();		
				}, 3000);
			}
		}	
	}		
} 

module.exports = {FirstRound: FirstRound, FinalRound: FinalRound};