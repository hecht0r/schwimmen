const helper = require('./helpers.js');
const deck = require('./classes/deck.js');
const round = require('./classes/round.js');
const card = require('./classes/card.js');

let	d = new deck();
d.createDeck();

module.exports.playCard = function(socket, data) {
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let r = g.getCurrentRound();
	let player = m.findPlayerById(socket.id);
	let playedCard = d.getCardById(data.card);

	// append card to round.playedCards and give info to all players clients
	r.cardsPlayed.push({player: player, card: playedCard});
	
	// dont show card in first round to others
	if (g.rounds.length > 1 || r.action === 'startOpen'){
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
		nextPlayer.emit('yourTurn');
		if (r instanceof round.FinalRound){
		 	nextPlayer.emit('yourTurnLast')
		}else{
		 	nextPlayer.emit('yourTurn');
		}
		m.emitPlayers('nextPlayer', nextPlayer.socket.username);
	}
}	

module.exports.melding = function(socket, data) {
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let player = m.findPlayerById(socket.id);
	let playedCard = d.getCardById(data.card);
	let team = m.findTeamById(player.socket.id);

	// possible if player helds both koenig and ober of the chosen suit
	// and he has not yet melded this suit and he/his team has already won a round
	if (player.hand.filter(x => x.id === new card(playedCard.suit, 'Koenig', 4).id).length > 0	&&
		player.hand.filter(x => x.id === new card(playedCard.suit, 'Ober', 3).id).length > 0	&&
		player.meldedSuits.indexOf(playedCard.suit) == -1 &&  team.wonCards.length > 0 ) {
	
		let bonus;
		if (playedCard.suit == g.trumpcard.suit) {
			bonus = 40;
		}else{
			bonus = 20;
		}
		team.score += bonus;
		player.meldedSuits.push(playedCard.suit);
		console.log(`${player.socket.username} melds ${bonus}`);
		team.emitPlayers('updateScore', team.score);
		m.emitPlayers('melded', {player: socket.username, suit: playedCard.suit});
		player.emit('yourTurn');		

		if (team.score >= score_to_win) { 
			g.end(team);
		}

	}else{
		// if(g.getCurrentRound() instanceof round.FinalRound){
			// player.emit('invalidEnd', playedCard.suit + ' melden nicht möglich');
		// }else{
			player.emit('invalidAction', playedCard.suit + ' melden nicht möglich');
		//  }
	};	
}

module.exports.checkMelding = function(cards){
	for( let i = 0; i < deck.suits.length; i++ ){
		if (cards.filter(x => x.id === new card(deck.suits[i], 'Koenig', 4).id).length > 0	&&
			cards.filter(x => x.id === new card(deck.suits[i], 'Ober', 3).id).length > 0 ) {
			return true;
		}
	}
	return false;
}

module.exports.getTrumpcard = function(socket, data) {
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let player = m.findPlayerById(socket.id);
	let playedCard = d.getCardById(data.card);
	
	// check if 7 trump was chosen and player already has won cards 
	if ((playedCard.suit == g.trumpcard.suit) && (playedCard.value == 0) && 
		(g.trumpcard.value > 0) 		&& (m.findTeamById(player.socket.id).wonCards.length > 0)){

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
	if (module.exports.checkForfeit(player.hand)){
		let r = m.getCurrentGame().getCurrentRound();
		r.replayGame();
	}else{
		player.emit('invalidStart', 'Dafür musst Du drei 7er oder weniger als 8 Punkte auf der Hand haben.');
	}
}	

module.exports.checkForfeit = function(cards){
	if (cards.filter(card => [0].indexOf(card.value) != -1).length > 2 || helper.getCardsValue(cards) < 8){
		return true;
	}
	else{
		return false;
	}
}

module.exports.higher = function(socket, data){
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let player = m.findPlayerById(socket.id);
	let playedCard = d.getCardById(data.card);
	
	// no trump & no aces 
	if (playedCard.suit == g.trumpcard.suit || playedCard.rank == 'Ass') {
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
	
	// no trump, only aces but not if the player has duplicates
	if (playedCard.suit == g.trumpcard.suit || playedCard.rank !== 'Ass' ||
		player.hand.filter(c => [playedCard.id].indexOf(c.id) != -1).length > 1) {
			player.emit('invalidStart', 'Es dürfen nur Asse gepielt werden. Trumpf oder doppelte Asse dürfen nicht gespielt werden.');
	}else{
		g.getCurrentRound().action = data.action;
		m.emitPlayers('firstRoundAction', 'Zweites Ass');
		module.exports.playCard(socket, data);
	}
}

module.exports.startOpen = function(socket, data){
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let player = m.findPlayerById(socket.id);
	
	// only allowed if player holds only trump and duplicate aces
	// so remove non-trumps and non-aces
	let cardsFiltered = (player.hand.filter(c => [g.trumpcard.suit].indexOf(c.suit) === -1 && ['Ass'].indexOf(c.rank)));

	// now check if all remaining aces are duplicates
	let actionValid = true;
	for(let i = 0; i < cardsFiltered.length; i++){
		if (cardsFiltered.filter(c => [cardsFiltered[i].id].indexOf(c.id) != -1).length === 1){
			actionValid = false;
			break;
		}
	}
	
	// if so, playing an open card is a valid option to start
	if (actionValid){
		g.getCurrentRound().action = data.action;
		m.emitPlayers('firstRoundAction', 'Offen raus');
		module.exports.playCard(socket, data);			
	}else{
		player.emit('invalidStart', 'Bitte mit Höher oder zweitem Ass beginnen.');
	}
}

module.exports.playCardLast = function(socket, data){
	let m = helper.findMatchById(data.matchId);
	let r = m.getCurrentGame().getCurrentRound();
	let player = m.findPlayerById(socket.id);
	let playedCard = d.getCardById(data.card);
	
	// check if the correct suit was played
	if (r.cardsPlayed.length > 0 && r.cardsPlayed[0].card.suit !== playedCard.suit &&
		player.hand.filter(card => [r.cardsPlayed[0].card.suit].indexOf(card.suit) != -1).length > 0) {
		player.emit('invalidEnd','Es muss ' + r.cardsPlayed[0].card.suit + ' gespielt werden.');
		//player.emit('invalidAction','Es muss ' + r.cardsPlayed[0].card.suit + ' gespielt werden.');
	}else{
		module.exports.playCard(socket, data);
	}
}