// when client joined a match, emitted to only one client
socket.on('userSet', function(data) {
	username = data.username;
	matchId = data.matchId;
	$('.login.page').fadeOut();
	$('.game.page').show();
	$('.login.page').off('click');
	show('gameLog');
	show('standings'); 
	show('standingsTotal'); 
	//show('links');
	document.body.appendChild(document.createTextNode('Hello ' + data.username));
});

// when client can choose maxPlayers, emitted to only one client
socket.on('setSettings', function() {
 	maxPlayersSet = false;
	$('.game.page').fadeOut();
	$('.settings.page').show();
	$('.game.page').off('click');
});

// when someone joined the match, emitted to all clients of the match
socket.on('userJoined', function(data) {
	write('gameLog', data.username + ' betritt das Spiel. ' + data.count );
});

// when a new game starts, emitted to all clients of the match
socket.on('newGame', function(data) {
	removeActions();
	clear('middleCards');
	clear('gameStatus');
	write('gameLog', data + ' beginnt das Spiel');
	
	// init middleCards
	let card;
	let middleCards = document.getElementById('middleCards');
	for (let i = 0; i < 3; i++) {
		card = document.createElement('img');
		card.setAttribute('class','card');
		card.setAttribute('src',`/images/cards/back.png`);
		middleCards.appendChild(card);
	};
});

// update standings, emitted to all clients of the match   
socket.on('updateScoreboard', function(data) {
	clear('standings');
	clear('standingsTotal');
	show('standings'); //show('gameScore'); //writeHeader('gameScore','Spielstand')
	show('standingsTotal'); //show('totalScore'); //writeHeader('totalScore','Gesamtspielstand')
	
	let score;
	for(let i = 0; i < data.length; i++){
		if (data[i].score >= 0){
			score = "I".repeat(data[i].score);
		}else{
			score = data[i].score;
		}
		write('standings', data[i].player + ': ' +  score);
		write('standingsTotal', data[i].player + ': ' + data[i].wins);		
	} 
});

// update clients cards, emitted to one client after another
socket.on('updateHand', function(data) {
	clear('playerCards');
	for (let i = 0; i < data.length; i++) {
		let card = document.createElement('img');
		card.setAttribute('class','card');
		card.setAttribute('src',`/images/cards/${data[i].id}.jpg`);
		card.setAttribute('onclick','selectCard(this,"' + data[i].id + '")');
		let myCards = document.getElementById('playerCards');
		myCards.appendChild(card);
	};
});

// update game cards
socket.on('updateMiddlecards', function(data) {
	clear('middleCards');
	let card;
	let middleCards = document.getElementById('middleCards');
	for (let i = 0; i < data.length; i++) {
		card = document.createElement('img');
		card.setAttribute('class','card');
		card.setAttribute('src',`/images/cards/${data[i].id}.jpg`);
		card.setAttribute('onclick','selectMiddleCard(this,"' + data[i].id + '")');
		middleCards.appendChild(card);
	};
	card = document.createElement('img');
	card.setAttribute('class','card');
	card.setAttribute('src',`/images/cards/back.png`);
	middleCards.appendChild(card);
})

// show move in log
socket.on('move', function(data) {
	if (data.includes('klopft')){
		writeBold('gameLog', data);
	}else{
		write('gameLog', data);
	}
})

// round is over
socket.on('roundOver', function(data) {
	write('gameLog', '------------------');
	removeActions();
	clear('gameStatus');
	setCountdown(10);
})

// everyone shoved -> new middleCards
socket.on('newMiddlecards', function(data) {
	write('gameLog', 'Neue Karten in der Mitte');
})

// game is over
socket.on('gameOver', function(data) {
	clear('gameLog');
})

// gameresults
socket.on('results', function(data) {
	writeBold('gameLog', data.player + ': ' + data.score)
})

// show roundlosers in log
socket.on('losers', function(data) {
	write('gameLog', data + ' verliert');
})

// show swimmers in log
socket.on('swim', function(data) {
	writeBold('gameLog', data + ' schwimmt')
})

// show gamewinner in log
socket.on('winner', function(data) {
	writeBold('gameLog', data + ' gewinnt das Spiel')
})

// if a player is out, remove cards
socket.on('out', function(data) {

	writeBold('gameLog', data + ' ist raus');
	if(data == username){
		removeActions();
		clear('middleCards');
		clear('playerCards');
		clear('gameStatus');
		
		let div = document.getElementById('middleCards');
		img = document.createElement('img');
		img.setAttribute('class','gameover');
		img.setAttribute('src','/images/gameover.png');
		div.appendChild(img);
	}
})

// when it's clients turn to start, emitted to starter only
socket.on('yourStartTurn', function() {
	actionCanBeSent = true;
	addActions('firstMove');
})

// when it's clients turn to start, emitted to starter only
socket.on('yourTurnNoKnock', function() {
	actionCanBeSent = true;
	addActions('noKnock');
})

// when it's clients turn to play, emitted to one client after another
socket.on('yourTurn', function() {
	actionCanBeSent = true;
	addActions('regular');
})

// tell all players whos turn it is, emitted to all clients of the game
socket.on('nextPlayer', function(data) {
	clear('gameStatus');
	if(data == username){
		write('gameStatus', 'Du bist dran');
	}else{
		write('gameStatus', data + ' ist dran');
	}
});

//when a client disconnected, emitted to all clients of the match
socket.on('playerDisconnected', function(data) {
  	removeActions();
	clear('middleCards');
	clear('playerCards');
	write('gameLog', data + ' hat das Spiel verlassen');
});