const helper = require('./../helpers.js');

class Round {
	constructor(starter) {
		this.starter = starter;
		this.cardsPlayed = [];  
	}	

	endGame(winner){
		m.getCurrentGame().winner = winner;
		winner.wins += 1;
		let s = m.getCurrentGame().starter; 
		console.log(`${winner.playerName} gewinnt!`);
		io.sockets.emit('gameOver', winner.playerName);
		
		let scoreBoard =[];
		for (let i = 0; i < players.length; i++) {
			scoreBoard.push({player: players[i].playerName, score: players[i].wins});
		}
		io.sockets.emit('updateScoreboard',scoreBoard);
		
		setTimeout(function() {
			m.startGame(helper.getNextPlayer(s));
		}, 7000);
	}

	replayGame(){
		io.sockets.emit('restart');
		m.getCurrentGame().starter.socket.emit('restartGame');
		setTimeout(function() {
			m.startGame(m.getCurrentGame().starter);
		}, 5000);
	}

	getCardsValue(cards){
		let total = 0
		for (let i = 0; i < cards.length; i++) {
			total += cards[i].card.value;
		}
		return total;
	}
}

class FirstRound extends Round {
	
	constructor(starter) {
		super(starter);
		this.action;
	}	
	
	start() {
		this.starter.socket.emit('startGame');
	}	

	end(){
		// first show all cards
		let cards = [];
		for (let i = 0; i < this.cardsPlayed.length; i++){
			cards.push({player: this.cardsPlayed[i].player.playerName, 
						card:  this.cardsPlayed[i].card});
		}
		io.sockets.emit('showCards', cards);
		
		let cardsFiltered;
		let winner;
		switch(this.action){
			case "higher":
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
				let c = [];
				for (let i = 0; i < cardsFiltered.length; i++){
					c.push({player: cardsFiltered[i].player, value: cardsFiltered[i].card.value});
				}
				c.sort(function(a, b){return b.value-a.value});
				winner = c[0].player;
				break;
			case "secondAce":
				// check if someone played the same card as first player
				cardsFiltered = this.cardsPlayed.slice(1).filter(c => ( c.card.id == this.cardsPlayed[0].card.id));
				if(cardsFiltered.length > 0){
					winner = cardsFiltered[0].player;
				}else{
					winner = this.cardsPlayed[0].player;
				}
				
				break;
		}
		let total = super.getCardsValue(this.cardsPlayed);
		console.log(winner.playerName + ' gets ' + total + ' points!');
		winner.score += total;
		winner.socket.emit('updateScore', winner.score);

		for (let i = 0; i < this.cardsPlayed.length; i++) {
			winner.wonCards.push(this.cardsPlayed[i].card);	
		}

		setTimeout(function() {
			// draw Card, first winner
			winner.hand.push(m.getCurrentGame().deck.drawCard());	
			winner.socket.emit('updateHand', winner.hand);	
			// now everybody else in correct order
			let player = helper.getNextPlayer(winner);
			for (let i = 1; i < players.length; i++) {
				player.hand.push(m.getCurrentGame().deck.drawCard());	
				player.socket.emit('updateHand', player.hand);	
				player = helper.getNextPlayer(player);
			}	
			// start new round		
			let r = new RegularRound(winner);
			m.getCurrentGame().rounds.push(r);
	
			io.sockets.emit('newRound',winner.playerName);
			r.start();		
		}, 3000);
	}
}	


class RegularRound extends Round {
	constructor(starter) {
		super(starter);
	}	
	
	start() {
		this.starter.socket.emit('yourTurn');
	}	

	end(){
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
		let total = super.getCardsValue(this.cardsPlayed);
		console.log(winner.playerName + ' gets ' + total + ' points!');
		winner.score += total;
		winner.socket.emit('updateScore', winner.score);
		
		for (let i = 0; i < this.cardsPlayed.length; i++) {
			winner.wonCards.push(this.cardsPlayed[i].card);	
		}
		
		if (winner.score >= score_to_win) {
			super.endGame(winner);
		}else{
			setTimeout(function() {
				// draw Card, first winner
				winner.hand.push(m.getCurrentGame().deck.drawCard());	
				winner.socket.emit('updateHand', winner.hand);	
				// now everybody else in correct order
				let player = helper.getNextPlayer(winner);
				for (let i = 1; i < players.length; i++) {
					player.hand.push(m.getCurrentGame().deck.drawCard());	
					player.socket.emit('updateHand', player.hand);	
					player = helper.getNextPlayer(player);
				}
			
				// start new round		
				io.sockets.emit('newRound',winner.playerName);
				let r;
				if (m.getCurrentGame().deck.cards.length > 0){
					r = new RegularRound(winner);
				}else{
					r = new LastRound(winner);
					io.sockets.emit('lastRounds', m.getCurrentGame().trumpcard.suit);
				}
				m.getCurrentGame().rounds.push(r);
			
				r.start();		
			}, 3000);
		}	

		console.log('Standings');
		for (let i = 0; i < players.length; i++) {
			console.log(players[i].playerName + ': ' + players[i].score);  
		}
	}
}	


class LastRound extends Round {
	constructor(starter) {
		super(starter);
		
	}	
	
	start() {
		this.starter.socket.emit('yourTurnLast');
	}	
	
	end(){
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
		let total = super.getCardsValue(this.cardsPlayed);
		console.log(winner.playerName + ' gets ' + total + ' points!');
		winner.score += total;
		winner.socket.emit('updateScore', winner.score);
		
		for (let i = 0; i < this.cardsPlayed.length; i++) {
			winner.wonCards.push(this.cardsPlayed[i].card);	
		}

		if (winner.score >= score_to_win) {
			super.endGame(winner);
		}else{
			if(winner.hand.length == 0){
				// no more cards, player with most points wins
				let players = m.getCurrentGame().players;
				players.sort((a, b) => (a.score < b.score) ? 1 : -1)
				super.endGame(players[0]);
			}else{
				setTimeout(function() {
					// start new round		
					let r = new LastRound(winner);
					m.getCurrentGame().rounds.push(r);
					
					io.sockets.emit('newRound',winner.playerName);
					r.start();		
				}, 3000);
			}
		}	
		
		console.log('Standings');
		for (let i = 0; i < players.length; i++) {
			console.log(players[i].playerName + ': ' + players[i].score);  
		}		

	}		
}

module.exports = { Round: RegularRound, FirstRound: FirstRound, LastRound: LastRound };