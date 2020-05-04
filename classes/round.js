class Round {
	constructor(players, starter) {
		this.players = players;
		this.starter = starter;
		this.cardsPlayed = [];  
	}	
	/*
	checkActionThreeSeven(cards){
		if (cards.filter(card => ["7"].indexOf(card.rank) != -1	).length > 2){
				return true;
		}	
		return false;
	}
	
	checkActionHigher(cards, trumpcard){
		cards = cards.filter(card => card.suit !== trumpcard.suit);
		cards = cards.filter(card => card.rank !== 'ass');
		if (cards.length > 0) {
			return true;
		}
		return false;
	}

	checkActionSecondAce(cards, trumpcard){
		let aces = ["ea","sa","ha","ba"].filter(ace => ace.substr(0,1) !== trumpcard.suit.substr(0,1));
		for (let i = 0; i < aces.length; i++) {
			if (cards.filter(card => [aces[i]].indexOf(card.id) != -1 ).length == 1){
				return true;
				break;
			}
		}
		return false;
	}	

	checkMelding(cards){
		if (((cards.filter(card => ["ek"].indexOf(card.id) != -1 ).length > 0) && (cards.filter(card => ["eo"].indexOf(card.id) != -1 ).length > 0)) ||
			((cards.filter(card => ["sk"].indexOf(card.id) != -1 ).length > 0) && (cards.filter(card => ["so"].indexOf(card.id) != -1 ).length > 0)) ||
			((cards.filter(card => ["hk"].indexOf(card.id) != -1 ).length > 0) && (cards.filter(card => ["ho"].indexOf(card.id) != -1 ).length > 0)) ||
			((cards.filter(card => ["bk"].indexOf(card.id) != -1 ).length > 0) && (cards.filter(card => ["bo"].indexOf(card.id) != -1 ).length > 0))){
			return true;
		};	
		return false;
	}	
	*/
}

class FirstRound extends Round {
	
	constructor(players, starter) {
		super(players, starter);
	}	

	setActions() {
		let actions = [];	
		
//		if (this.checkActionHigher(this.startPlayer.playerCards,this.trumpcard)){
			actions.push('higher');
//		}
//		if (this.checkActionThreeSeven(this.startPlayer.playerCards)){
			actions.push('forfeit');	
//		}
//		if (this.checkActionSecondAce(this.startPlayer.playerCards,this.trumpcard)){
			actions.push('secondAce');	
//		}
  		return actions;
	}

		
	start() {
		this.starter.socket.emit('start_game', this.setActions());
		this.starter.socket.broadcast.emit('bc_start_game', this.starter.playerName);
	}	

}	


class RegularRound extends Round {
	constructor(players, starter) {
		super(players, starter);
	}	
	
	start() {
		this.starter.socket.emit('yourTurn');
		//this.starter.socket.broadcast.emit('bc_start_game', this.starter.playerName);		
	}	
}	


class LastRound extends Round {
	constructor(players, starter) {
		super(players, starter);
		
	}	
	
	start() {
		
	}	
}

module.exports = { Round: RegularRound, FirstRound: FirstRound, LastRound: LastRound };