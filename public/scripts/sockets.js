var gameOverInterval;

// when client joined a match, emitted to only one client
socket.on('userSet', function(data) {
	username = data.username;
	matchId = data.matchId;
	$('.login.page').fadeOut();
	$('.game.page').show();
	$('.login.page').off('click');
	show('gameLog');
	show('gameScore');
	show('totalScore');
	show('board');
	show('links');
	document.body.appendChild(document.createTextNode('Hello ' + data.username));
});

// when client can choose maxPlayers, emitted to only one client
socket.on('setSettings', function() {
	clear('settings');
	let input = document.createElement('input');
	input.setAttribute('type', 'number');
	input.setAttribute('id', 'maxPlayers');
	input.setAttribute('min', 2);
	input.setAttribute('max', 9);

	let label = document.createElement('Label');
    label.setAttribute('for',input);
    label.innerHTML = 'Anzahl Spieler';
		
	let btn = document.createElement('button');
	btn.innerHTML = 'Speichern';
	btn.addEventListener('click', function () {
		setSettings(); 
	});

	let settings = document.getElementById('settings');
	settings.appendChild(label);
	settings.appendChild(input);
	settings.appendChild(btn);
});

// when someone joined the match, emitted to all clients of the match
socket.on('userJoined', function(data) {
	write('gameLog', data.username + ' betritt das Spiel. ' + data.count );
});

// when a new game starts, emitted to all clients of the match
socket.on('newGame', function(data) {
	removeActions();
	clearInterval(gameOverInterval);
	document.getElementById('gameOver').innerHTML = "";
	clear('settings');
	clear('middleCards');
	clear('gameLog');
	clear('nextPlayer');
	writeHeader('gameLog','Aktuelles Spiel')
	write('gameLog', data + ' beginnt das Spiel');
});

// update standings, emitted to all clients of the match   
socket.on('updateScoreboard', function(data) {
	clear('gameScore');
	clear('totalScore');
	writeHeader('gameScore','Spielstand')
	writeHeader('totalScore','Gesamtspielstand')
	for(let i = 0; i < data.length; i++){
		write('gameScore', data[i].player + ': ' + data[i].score);
		write('totalScore', data[i].player + ': ' + data[i].wins);		
	} 
});

// update clients cards, emitted to one client after another
socket.on('updateHand', function(data) {
	clear('myCards');
	for (let i = 0; i < data.length; i++) {
		let card = document.createElement('img');
		card.setAttribute('class','card');
		card.setAttribute('src',`/images/${data[i].id}.jpg`);
		card.setAttribute('onclick','selectCard(this,"' + data[i].id + '")');
		let myCards = document.getElementById('myCards');
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
		card.setAttribute('src',`/images/${data[i].id}.jpg`);
		card.setAttribute('onclick','selectMiddleCard(this,"' + data[i].id + '")');
		middleCards.appendChild(card);
	};
	card = document.createElement('img');
	card.setAttribute('class','card');
	card.setAttribute('src',`/images/back.png`);
	middleCards.appendChild(card);
})

// shoe move in log
socket.on('move', function(data) {
	write('gameLog', data);
})

// round is over
socket.on('roundOver', function(data) {
	removeActions();
	clear('gameLog');
	clear('nextPlayer');
	writeHeader('gameLog','Aktuelles Spiel')
})
// gameresults
socket.on('results', function(data) {
	write('gameLog', data.player + ': ' + data.score);
})

// show roundlosers in log
socket.on('losers', function(data) {
	write('gameLog', data + ' verliert');
})

// show swimmers in log
socket.on('swim', function(data) {
	write('gameLog', data + ' schwimmt');
})

// show gamewinner in log
socket.on('winner', function(data) {
	write('gameLog', data + ' gewinnt das Spiel');
})

// if a player is out, remove cards
socket.on('out', function(data) {
	write('gameLog', data + ' ist raus');
	if(data == username){
		removeActions();
		clear('middleCards');
		clear('myCards');
		clear('nextPlayer');
		gameOverInterval = setInterval(gameOver,1000);
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
	clear('nextPlayer');
	if(data == username){
		write('nextPlayer', 'Du bist dran');
	}else{
		write('nextPlayer', data + ' ist dran');
	}
});

//when a client disconnected, emitted to all clients of the match
socket.on('playerDisconnected', function(data) {
	removeActions();
	clear('middleCards');
	clear('myCards');
	write('gameLog', data + ' hat das Spiel verlassen');
});