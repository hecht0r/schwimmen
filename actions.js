const helper = require('./helpers.js');
const deck = require('./classes/deck.js');
const round = require('./classes/round.js');
const card = require('./classes/card.js');

let	d = new deck();
d.createDeck();

module.exports.playCard = function(socket, data) {
	// let m = rooms[data.roomIndex];
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let r = g.getCurrentRound();
	let player = m.findPlayerById(socket.id);
	let playedCard = d.getCardById(data.card);

	// append card to round.playedCards and give info to all players clients
	r.cardsPlayed.push({player: player, card: playedCard});
	
	// dont show card in first round to others
	if (g.rounds.length > 1){
		m.emitPlayers('cardPlayed', {player: socket.username, card: playedCard});
	}else{
		m.emitPlayers('cardPlayed', {player: socket.username});
	};	
	
	// update hand without playedCard
	player.emit('updateHand', helper.removeCardFromHand(player.hand, playedCard));	
	
	// if everybody has played a card, we end this round
	// if not, tell next players client to play a card
	let nextPlayer;
	if (r.cardsPlayed.length == m.players.length) {
		r.end();
	}else{
		nextPlayer = m.getNextPlayer(player);
		if (r instanceof round.FinalRound){
			nextPlayer.emit('yourTurnLast')
		}else{
			nextPlayer.emit('yourTurn');
		}
		m.emitPlayers('nextPlayer', nextPlayer.socket.username)
	};
}	

module.exports.melding = function(socket, data) {
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let player = m.findPlayerById(socket.id);
	let playedCard = d.getCardById(data.card);
		
	// possible if player helds both koenig and ober of the chosen suit
	// and he has not yet melded this suit and he has already won a round
	if (player.hand.filter(x => x.id === new card(playedCard.suit, 'Koenig', 4).id).length > 0	&&
		player.hand.filter(x => x.id === new card(playedCard.suit, 'Ober', 3).id).length	> 0		&&
		player.meldedSuits.indexOf(playedCard.suit) == -1 &&  player.wonCards.length > 0 ) {
	
		let bonus;
		if (playedCard.suit == g.trumpcard.suit) {
			bonus = 40;
		}else{
			bonus = 20;
		}
		player.score += bonus;
		player.meldedSuits.push(playedCard.suit);
		console.log(`${player.socket.username} melds ${bonus}`);
		player.emit('updateScore', player.score);
		m.emitPlayers('melded', {player: socket.username, suit: playedCard.suit});
		player.emit('yourTurn');		

		if (player.score >= score_to_win) { 
			g.end(player);
		}

	}else{
		if(g.getCurrentRound() instanceof round.FinalRound){
			player.emit('invalidEnd','Melden nicht möglich');
		}else{
			player.emit('invalidAction','Melden nicht möglich');
		}
	};	
}

module.exports.getTrumpcard = function(socket, data) {
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let player = m.findPlayerById(socket.id);
	let playedCard = d.getCardById(data.card);
	
	// check if 7 trump was chosen and player already has won cards 
	if ((playedCard.suit == g.trumpcard.suit) && (playedCard.value == 0) && 
		(g.trumpcard.value > 0) 		&& (player.wonCards.length > 0)){
		
		// we change trumpcard and playedCard and inform all clients about the new trumpcard
		player.hand.push(g.trumpcard);
		helper.removeCardFromHand(player.hand, playedCard);
		g.trumpcard = playedCard;
		g.deck.cards.splice(-1,1);
		g.deck.cards.push(playedCard);
		player.emit('updateHand', player.hand);	
		player.emit('yourTurn');		
		m.emitPlayers('updateTrumpcard', {player: socket.username, trumpcard: g.trumpcard});
	}else{
		player.emit('invalidAction','Trumpfkarte holen nicht möglich.');
	}
}	

module.exports.forfeit = function(socket, data) {
	let m = helper.findMatchById(data.matchId);
	let player = m.findPlayerById(socket.id);

	// if a player Starts with three sevens, he can give back his hand 
	// the game will be restarted
	if (player.hand.filter(card => [0].indexOf(card.value) != -1).length > 2){
		let r = m.getCurrentGame().getCurrentRound();
		r.replayGame();
	}else{
		player.emit('invalidStart', 'Dafür musst Du drei 7er haben.');
	}
}	

module.exports.higher = function(socket, data){
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let player = m.findPlayerById(socket.id);
	let playedCard = d.getCardById(data.card);
	
	// no trump & no aces 
	if (playedCard.suit == g.trumpcard.suit || playedCard.rank == "Ass") {
		player.emit('invalidStart', 'Trumpf oder Ass darf nicht gespielt werden.');
	}else{
		g.getCurrentRound().action = data.action;
		m.emitPlayers('firstRoundAction', 'Höher sticht');
		module.exports.playCard(socket, data);
	}
}

module.exports.secondAce = function(socket, data){
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let player = m.findPlayerById(socket.id);
	let playedCard = d.getCardById(data.card);
	// no trump, only aces but not if the player has it twice on his hand
	if (playedCard.suit == g.trumpcard.suit || playedCard.rank !== "Ass" ||
		player.hand.filter(c => [playedCard.id].indexOf(c.id) != -1).length > 1) {
			player.emit('invalidStart', 'Es dürfen nur Asse gepielt werden. Trumpf oder doppelte Asse dürfen nicht gespielt werden.');
	}else{
		g.getCurrentRound().action = data.action;
		m.emitPlayers('firstRoundAction', 'Zweites Ass');
		module.exports.playCard(socket, data);
	}
}

module.exports.playCardLast = function(socket, data){
	let m = helper.findMatchById(data.matchId);
	let r = m.getCurrentGame().getCurrentRound();
	let player = m.findPlayerById(socket.id);
	let playedCard = d.getCardById(data.card);

	if (r.cardsPlayed.length > 0 && r.cardsPlayed[0].card.suit !== playedCard.suit &&
		player.hand.filter(card => [r.cardsPlayed[0].card.suit].indexOf(card.suit) != -1).length > 0) {
		player.emit('invalidEnd','Es muss ' + r.cardsPlayed[0].card.suit + ' gespielt werden.');
	}else{
		module.exports.playCard(socket, data);
	}
}