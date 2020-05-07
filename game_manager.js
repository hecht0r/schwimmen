const socketio = require("socket.io");
const player = require('./classes/player.js');
const match = require('./classes/match.js');
const round = require('./classes/round.js');
const deck = require('./classes/deck.js');
const c = require('./classes/card.js');
const helper = require('./helpers.js');
const players_max = 2;

global.score_to_win = 101;
global.m;
players = [];
let	d = new deck();
d.createDeck();


module.exports.listen = function(app) {
	io = socketio.listen(app);
	io.on('connection', function(socket) {

		socket.on('setUsername', function(data) {
			console.log(`${data} connected`);
			setUsername(socket, data);
		});
		
		socket.on('validateAction', function(data) {
			validateAction(socket, data);
		});	

		socket.on('disconnect', function () {
			// if our player was part of the game, we kick him from players
			if (players.indexOf(helper.findPlayerById(socket.id)) > -1 ){
				players.splice(players.indexOf(helper.findPlayerById(socket.id)),1);
				console.log(`Anzahl Spieler: ${players.length}`)
				console.log(`${socket.username} disconnected`);
				m = null;
			}
		});
	});
	return io;
}

  
function removeCardFromHand	(cards, card) {
	// find given card and remove it from given cards
	cards.splice(cards.findIndex(c => c.id == card.id), 1 );
	return cards;
}

function validateAction(socket, data) {
	let playedCard = d.getCardById(data.card);
	switch (data.action) {
		case "playCard":
			playCard(socket, playedCard);
			break;
		case "melding":
			melding(socket, playedCard);
			break;			
		case "getTrumpcard":
			getTrumpcard(socket, playedCard);
			break;
		case "forfeit":
			forfeit(socket);
			break;
		case "higher":
			higher(socket, playedCard, data.action);
			break;
		case "secondAce":
			secondAce(socket, playedCard, data.action);
			break;
		case "playCardLast":
			playCardLast(socket, playedCard);
			break;
	}
}

function setUsername(socket, username) {
	//if(players.indexOf(username) > -1) {
	//   socket.emit('userExists', data + ' username is taken! Try some other username.');
	//}else {
	if (players.length < players_max){
		socket.username = username;
		players.push(new player(socket));
		console.log(`Anzahl Spieler: ${players.length}`)
		socket.emit('userSet', {username: username});
		socket.broadcast.emit('userJoined', {username: username, count: players.length});
	
		if (players.length == players_max){
			setTimeout(function() {
				m = new match(players);
				m.startGame(players[Math.floor(Math.random() * players.length)]);
			
			}, 3000);
		}
	}
}

// actions
function playCard(socket, card) {
	// append card to round.playedCards and give info to all players clients
	// also update hand without playedCard
	let g = m.getCurrentGame();
	let r = g.getCurrentRound();
	let player = helper.findPlayerById(socket.id);
	r.cardsPlayed.push({player: player, card: card});
	
	// dont show card in first round to others
	if (g.rounds.length > 1){
		io.sockets.emit('cardPlayed', {player: socket.username, card: card});
	}else{
		io.sockets.emit('cardPlayed', {player: socket.username});
	};	
	
	socket.emit('updateHand', removeCardFromHand(player.hand, card));	
	
	// if everybody has played a card, we end this round
	// if not, tell next players client to play a card
	if (r.cardsPlayed.length == m.players.length) {
		r.end();
	}else{
		if (r instanceof round.LastRound){
			helper.getNextPlayer(player).socket.emit('yourTurnLast')
		}else{
			helper.getNextPlayer(player).socket.emit('yourTurn');
		}
	};
}	

function melding(socket, card) {
	let g = m.getCurrentGame();
	let player = helper.findPlayerById(socket.id);
	
	// possible if player helds both koenig and ober of the chosen suit
	// and he has not yet melded this suit and he has already won a round
	if (player.hand.filter(x => x.id === new c(card.suit, 'Koenig', 4).id).length > 0	&&
		player.hand.filter(x => x.id === new c(card.suit, 'Ober', 3).id).length	> 0		&&
		player.meldedSuits.indexOf(card.suit) == -1 &&  player.wonCards.length > 0 ) {
	
		let bonus;
		if (card.suit == g.trumpcard.suit) {
			bonus = 40;
		}else{
			bonus = 20;
		}
		player.score += bonus;
		player.meldedSuits.push(card.suit);
		console.log(`${player.socket.username} melds ${bonus}`);
		socket.emit('updateScore', player.score);
		io.sockets.emit('melded', {player: socket.username, suit: card.suit});
		socket.emit('yourTurn');		

		if (player.score >= score_to_win) { 
			g.getCurrentRound().endGame(player);
		}

	}else{
		if(g.getCurrentRound() instanceof round.LastRound){
			socket.emit('invalidEnd','Melden nicht möglich');
		}else{
			socket.emit('invalidAction','Melden nicht möglich');
		}
	};	
}

function getTrumpcard(socket, card) {
	let g = m.getCurrentGame();
	let player = helper.findPlayerById(socket.id);
	
	// check if 7 trump was chosen and player already has won cards 
	if ((card.suit == g.trumpcard.suit) && (card.value == 0) && 
		(g.trumpcard.value > 0) 		&& (player.wonCards.length > 0)){
		
		// we change trumpcard and playedCard and inform all clients about the new trumpcard
		player.hand.push(g.trumpcard);
		removeCardFromHand(player.hand, card);
		g.trumpcard = card;
		g.deck.cards.splice(-1,1);
		g.deck.cards.push(card);
		socket.emit('updateHand', player.hand);	
		socket.emit('yourTurn');		
		io.sockets.emit('updateTrumpcard', {player: socket.username, trumpcard: g.trumpcard});
	}else{
		socket.emit('invalidAction','Trumpfkarte holen nicht möglich.');
	}
}	

function forfeit(socket) {
	let player = helper.findPlayerById(socket.id);

	// if a player Starts with three sevens, he can give back his hand 
	// the game will be restarted
	if (player.hand.filter(card => [0].indexOf(card.value) != -1).length > 2){
		let r = m.getCurrentGame().getCurrentRound();
		r.replayGame();
	}else{
		socket.emit('invalidStart', 'Dafür musst Du drei 7er haben.');
	}
}	

function higher(socket, card, action){
	let g = m.getCurrentGame();
	// no trump & no aces 
	if (card.suit == g.trumpcard.suit || card.rank == "Ass") {
		socket.emit('invalidStart', 'Trumpf oder Ass darf nicht gespielt werden.');
	}else{
		g.getCurrentRound().action = action;
		socket.broadcast.emit('firstRoundAction', 'Höher sticht')
		playCard(socket, card);
	}
}

function secondAce(socket, card, action){
	let g = m.getCurrentGame();
	// no trump, only aces but not if the player has it twice on his hand
	if (card.suit == g.trumpcard.suit || card.rank !== "Ass" ||
		helper.findPlayerById(socket.id).hand.filter(c => [card.id].indexOf(c.id) != -1).length > 1) {
		socket.emit('invalidStart', 'Es dürfen nur Asse gepielt werden. Trumpf oder doppelte Asse dürfen nicht gespielt werden.');
	}else{
		g.getCurrentRound().action = action;
		socket.broadcast.emit('firstRoundAction', 'Zweites Ass')
		playCard(socket, card);
	}
}

function playCardLast(socket, card){
	let g = m.getCurrentGame();
	let r = g.getCurrentRound();

	if (r.cardsPlayed.length > 0 && r.cardsPlayed[0].card.suit !== card.suit &&
		helper.findPlayerById(socket.id).hand.filter(card => [r.cardsPlayed[0].card.suit].indexOf(card.suit) != -1).length > 0) {
		socket.emit('invalidEnd','Es muss ' + r.cardsPlayed[0].card.suit + ' gespielt werden.');
	}else{
		playCard(socket, card);
	}
}