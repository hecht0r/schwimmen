const socketio = require("socket.io");
const player = require('./classes/player.js');
const match = require('./classes/match.js');
const deck = require('./classes/deck.js');
const round = require('./classes/round.js');

var m;
players = [];
var	d = new deck();
d.createDeck();

module.exports.listen = function(app) {
	io = socketio.listen(app);
	io.on('connection', function(socket) {

		socket.on('setUsername', function(data) {
			console.log(data + ' connected');
			setUsername(socket, data);
		});
		
		socket.on('validateAction', function(data) {
			validateAction(socket, data);
		});	

		socket.on('disconnect', function () {
			connsole.log(socket.username + ' disconnected');
		});
	});
	return io;
};

function findPlayerById(socketId) {
	for (let i = 0; i < players.length; i++) {
		if (players[i].socket.id === socketId) {
			return players[i];
		}
	}
	return false;
}

function setUsername(socket, username) {
	//if(users.indexOf(data) > -1) {
	//   socket.emit('userExists', data + ' username is taken! Try some other username.');
	//}else {
	socket.username = username;
	players.push(new player(socket));
	socket.emit('userSet', {username: username});

	if (players.length == 3){
		setTimeout(function() {
			m = new match(players);
			m.start();
		}, 1000);
	}	 
	//}
}

function getNextPlayer(player) {
	let index = players.indexOf(player);
	if (index == players.length-1){
		index = -1;
	}
	return players[index + 1];
};
    
function endRound(cards) {
	// get total value of current round
	let total = 0
	for (let i = 0; i < cards.length; i++) {
		total += cards[i].card.value;
	}

	// remove all non trump and non playedSuit cards
	let playedSuit = cards[0].card.suit;
	let cardsFiltered = cards.filter(c => ( c.card.suit == playedSuit || c.card.suit == m.getCurrentGame().trumpcard.suit ));

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
	console.log(winner.playerName + ' gets ' + total + ' points!');
	winner.score += total;
	winner.socket.emit('updateScore', winner.score);
	
	for (let i = 0; i < cards.length; i++) {
		winner.wonCards.push(cards[i].card);	
	}
	
	if (winner.score > 100) {
		endGame();
	}else{
		setTimeout(function() {
			// start new round		
			let r = new round.Round(players, winner);
			m.getCurrentGame().rounds.push(r);
			
			// draw Card, first winner
			console.log(m.getCurrentGame().deck.cards.slice(0,3));
			console.log(m.getCurrentGame().deck.cards.length);
			winner.hand.push(m.getCurrentGame().deck.drawCard());	
			winner.socket.emit('updateHand', winner.hand);	
			// now everybody else
			let player = getNextPlayer(winner);
			for (let i = 1; i < players.length; i++) {
				console.log(player.playerName);
				player.hand.push(m.getCurrentGame().deck.drawCard());	
				player.socket.emit('updateHand', player.hand);	
				player = getNextPlayer(player);
			}	
				
			io.sockets.emit('newRound');
			r.start();		
		}, 3000);
		
	}	
	console.log('Standings');
	for (let i = 0; i < players.length; i++) {
		console.log(players[i].playerName + ': ' + players[i].score);  
	}
};


function playCard(socket, card) {
	let r = m.getCurrentGame().getCurrentRound();
	let player = findPlayerById(socket.id);
	r.cardsPlayed.push({player: player, card: card});
	socket.emit('cardPlayed', {player: socket.username, card: card});
	socket.emit('updateHand', removeCardFromHand(player.hand, card));	
	socket.broadcast.emit('cardPlayed', {player: socket.username, card: card});
	
	if (r.cardsPlayed.length == r.players.length) {
		endRound(r.cardsPlayed);	
	}else{
		getNextPlayer(player).socket.emit('yourTurn');
	}
}	

function melding(socket, card) {
	let g = m.getCurrentGame();
	let player = findPlayerById(socket.id);
	if ((player.hand.findIndex(card => card.id === card.suit + 'k')) &&
	    (player.hand.findIndex(card => card.id === card.suit + 'o')) &&
	    (player.meldedSuits.indexOf(card.suit) == -1) && (player.wonCards.length > 0)){

		let bonus;
		if (card.suit == g.trumpcard.suit) {
			bonus = 40;
		}else{
			bonus = 20;
		}
		player.score += bonus;
		player.meldedSuits.push(card.suit);
		console.log(player.playerName + ' melds ' + bonus);
		if (player.score > 100) {
			endGame();
		}
		socket.emit('updateScore', player.score);
		socket.emit('melded', card.suit);		
		socket.emit('yourTurn');		
	}else{
		socket.emit('invalidCard');
	};	
}

function endGame() {
	console.log('Ende');
}
function getTrumpcard(socket, card) {
	let g = m.getCurrentGame();
	let player = findPlayerById(socket.id);
	
	// check if 7 trump was chosen and player already has won cards 
	if ((card.suit == g.trumpcard.suit) && (card.value == 0) && 
		(g.trumpcard.value > 0) 		&& (player.wonCards.length > 0)){
		
		player.hand.push(g.trumpcard);
		removeCardFromHand(player.hand, card);
		g.trumpcard = card;
		socket.emit('updateHand', player.hand);	
		socket.emit('yourTurn');		
		io.sockets.emit('updateTrump', g.trumpcard);
	}else{
		socket.emit('invalidCard');
	}
}	
	
function removeCardFromHand	(cards, card) {
	// find given card and remove it from given cards
	cards.splice(cards.findIndex(c => c.id == card.id), 1 );
	return cards;
}

function validateAction(socket, data) {
	let playedCard = d.getCardById(data.card);
	let g = m.getCurrentGame();
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
			break;
		case "higher":
			if ((playedCard.suit == g.trumpcard.suit) ||
			    (playedCard.rank == "ass")) {
				socket.emit('invalidCard');
			}else{
				playCard(socket, playedCard);
			}
			break;
		case "secondAce":
			if ((playedCard.suit == g.trumpcard.suit) ||
				(playedCard.rank !== "ass")) {
				socket.emit('invalidCard');
			}else{
				playCard(socket, playedCard);
			}
			break;
	}
}	