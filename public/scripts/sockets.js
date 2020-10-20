// when client joined a match, emitted to only one client
socket.on('userSet', function(data) {
	username = data.username;
	matchId = data.matchId;
	clear('login');
	show('gameLog');
	show('gameScore');
	show('totalScore');
	show('board');
	show('links');
	write('login','Hello ' + data.username)
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
	clear('settings');
	clear('middleCards');
	clear('gameLog');
	clear('nextPlayer');
	writeHeader('gameLog','Aktuelles Spiel')
	write('gameLog', data + ' beginnt das Spiel');
});

// when a game has finished, emitted to all clients of the match
socket.on('gameOver', function(data) {
	let text = document.createElement('b');
	text.innerHTML = data.winner + ' gewinnt das Spiel';
	let gameLog = document.getElementById('gameLog');
	gameLog.appendChild(text);
	gameLog.appendChild(document.createElement('br'));

	for(let i = 0; i < data.players.length; i++){
		let playerScore = document.createTextNode(data.player[i].name + ': ' + data.player[i].score);
		gameLog.appendChild(playerScore);
		gameLog.appendChild(document.createElement('br'));
	}
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

// gameresults
socket.on('results', function(data) {
	removeActions();
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
		let middleCards = document.getElementById('middleCards');
		let outMsg = document.createTextNode('Du bist raus!');
		middleCards.appendChild(outMsg);
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