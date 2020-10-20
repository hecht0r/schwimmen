const helper = require('./helpers.js');
const deck = require('./classes/deck.js');
const card = require('./classes/card.js');

let	d = new deck();
d.createDeck();
// data: matchId, action, card, middleCard

module.exports.change = function(socket, data) {
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let player = m.findPlayerById(socket.id);

	g.shoveCount = 0;
	g.moveCount++;

	let playerIndex = player.hand.findIndex(c => c.id === data.card);
	let middleIndex = g.middleCards.findIndex(c => c.id === data.middleCard);

	// move selected playerCard to middleCards
	let playerCard = d.getCardById(data.card);
	g.middleCards.splice(middleIndex, 0, playerCard);
	player.hand = helper.removeCard(player.hand, playerCard);	
	
	// append selected middleCard to playerCards
	let middleCard = d.getCardById(data.middleCard);
	player.hand.splice(playerIndex, 0, middleCard);
	g.middleCards = helper.removeCard(g.middleCards, middleCard);	

	endMove(socket, data);
}


module.exports.changeAll = function(socket, data) {
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let player = m.findPlayerById(socket.id);

	g.shoveCount = 0;
	g.moveCount++;

	// change playerCards with middleCards	
	let cards = g.middleCards;
	g.middleCards = player.hand;
	player.hand = cards;

	endMove(socket, data);
}

module.exports.shove = function(socket, data) {
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let player = m.findPlayerById(socket.id);
	
	g.shoveCount++;
	g.moveCount++;
	
	// if everyone shoved, get new middleCards
	if (g.shoveCount === m.players.length){
		g.shoveCount = 0;
		
		Array.prototype.push.apply(g.deck.cards, g.middleCards);
		g.middleCards = [];
		g.middleCards = g.deck.cards.splice(0,3);
	}
	endMove(socket, data);
}

module.exports.knock = function(socket, data) {
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let player = m.findPlayerById(socket.id);
	
	g.moveCount++;
	g.shoveCount = 0;	

	// (players.length - 1) moves till round ends
	g.knockCount = g.moveCount + g.players.length - 1;	

	endMove(socket, data);
}

module.exports.keep = function(socket, data) {
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	
	g.moveCount++;

	// deal middlecards
	g.middleCards = g.deck.cards.splice(0,3);
	g.emitPlayers('updateMiddlecards', g.middleCards);

	endMove(socket, data);
}

module.exports.new = function(socket, data) {
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let player = m.findPlayerById(socket.id);

	g.moveCount++;
	g.middleCards = g.deck.cards.splice(0,3);

	// change playerCards with middleCards	
	let cards = g.middleCards;
	g.middleCards = player.hand;
	player.hand = cards;

	endMove(socket, data);
}

endMove = function(socket, data){
	let m = helper.findMatchById(data.matchId);
	let g = m.getCurrentGame();
	let player = m.findPlayerById(socket.id);

	player.handValue = helper.handValue(player.hand);
	
	if(player.handValue >= 31 || ((g.knockCount === g.moveCount) && g.knockCount > 0)){
		g.end(player);
	};

	player.emit('updateHand', player.hand);
	g.emitPlayers('updateMiddlecards', g.middleCards);

	let nextPlayer = g.getNextPlayer(player);

	if((g.moveCount < g.players.length) || (g.knockCount > 0)){
		nextPlayer.emit('yourTurnNoKnock');
	}else{
		nextPlayer.emit('yourTurn');
	}

	m.emitPlayers('nextPlayer', nextPlayer.socket.username);
}