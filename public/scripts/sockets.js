// when client joined a match, emitted to only one client
socket.on('userSet', function(data) {
	username = data.username;
	matchId = data.matchId;
	clear("login");
	clear("rules");
	show("roundLog");
	show("gameLog");
	show("matchLog");
	show("board");
	show("myScore");
	writeLog("login",'Hello ' + data.username)
});

// when client can choose maxPlayers, emitted to only one client
socket.on('setSettings', function(data) {
	clear("settings");
	let input = document.createElement('input');
	input.setAttribute('type', 'number');
	input.setAttribute('id', 'maxPlayers');
	input.setAttribute('min', 2);
	input.setAttribute('max', 4);

	let label = document.createElement("Label");
    label.setAttribute("for",input);
    label.innerHTML = 'Anzahl Spieler';
		
	let btn = document.createElement('button');
	btn.innerHTML = 'Speichern';
	btn.addEventListener('click', function () {
		setSettings(); 
	});

	let settings = document.getElementById("settings");
	settings.appendChild(label);
	settings.appendChild(input);
	settings.appendChild(btn);
});

// when someone joined the match, emitted to all clients of the match
socket.on('userJoined', function(data) {
	writeLog("gameLog", data.username + ' betritt das Spiel. ' + data.count );
});

// when a new game starts, emitted to all clients of the match
socket.on('newGame', function(data) {
	removeActions();
	clear("settings");
	clear("playedCards");
	clear("trumpcard");
	clear("talon");
	clear("myMeldings");
	clear("myScore");
	writeLog("myScore", '0');
	clear("gameLog");
	writeHeader("gameLog","Aktuelles Spiel")
	clear("roundLog");
	writeHeader("roundLog","Aktuelle Runde");
	writeLog("roundLog", data + ' beginnt das Spiel');
});

// when a game has finished, emitted to all clients of the match
socket.on('gameOver', function(data) {
	let text = document.createElement("b");
	if (data.gigackel){
		text.innerHTML = data.winner + ' gewinnt das Spiel mit Gigackel';
	}else{
		text.innerHTML = data.winner + ' gewinnt das Spiel';
	}
	
	let gameLog = document.getElementById("gameLog");
	gameLog.appendChild(text);
	gameLog.appendChild(document.createElement("br"));
	});

// when a game is restarted, emitted to all clients of the match   
socket.on('restart', function() {
	clear("myActions");
	writeLog("gameLog", 'Spiel wird neu gestartet');
});

// update clients teamscore, emitted to all clients of a team
socket.on('updateScore', function(data) {
	clear("myScore");
	writeLog("myScore", data)
});

// update standings, emitted to all clients of the match   
socket.on('updateScoreboard', function(data) {
	clear("matchLog");
	writeHeader("matchLog","Spielstand")
	for(let i = 0; i < data.length; i++){
		writeLog("matchLog", data[i].team + ': ' + data[i].score);
	} 
});

// update clients cards, emitted to one client after another
socket.on('updateHand', function(data) {
	clear("myCards");
	for (let i = 0; i < data.length; i++) {
		let card = document.createElement('img');
		card.setAttribute('class','card');
		card.setAttribute('src',`/images/${data[i].id}.png`);
		card.setAttribute('onclick','selectCard(this,"' + data[i].id + '")');
		card.setAttribute('ondblclick','playCard(this,"' + data[i].id + '")');
		let myCards = document.getElementById("myCards");
		myCards.appendChild(card);
	};
});

// when a round has finished, emitted to all clients of the match   
socket.on('roundOver', function(data) {
	writeLog("roundLog", data + ' holt den Stich');
	writeLog("gameLog", data + ' holt den Stich');
});		

// when a round begins, emitted to all clients of the match   
socket.on('newRound', function(data) {
	clear("playedCards");
	clear("roundLog");
	writeHeader("roundLog","Aktuelle Runde");
});	

// when the client begins the game, emitted to one client
socket.on('startGame', function(data) {
	addActions('start');
});

// when the client can restart the game, emitted to one client
socket.on('forfeit', function() {
	addAction('forfeit');
});

// when the client can meld 20/40, emitted to one client
socket.on('melding', function() {
	addAction('melding');
});

// when talon is empty and final rounds begin, emitted to all clients of the match
socket.on('lastRounds', function(data) {
	clear("trumpcard");
	clear("talon");
	writeLog("roundLog", 'Farbe bedienen! Trumpf: ' + data);
	writeLog("gameLog", 'Farbe bedienen! Trumpf: ' + data);
})

// when it's clients turn to play, emitted to one client after another
socket.on('yourTurn', function() {
	actionCanBeSent = true;
	addActions('regular');
})

// when it's clients turn to play in final rounds, emitted to one client after another
socket.on('yourTurnLast', function(data) {
	actionCanBeSent = true;
	addActions('last');
})

// when a card is played, whos turn is it, emitted to all clients of the game
socket.on('nextPlayer', function(data) {
	writeLog("roundLog", data + ' ist dran');
});

// when someone melds, emitted to all clients of the game
socket.on('melded', function(data) {
	if(data.player == username){
		let suit = document.createElement('img');
		suit.setAttribute('src',`/images/${data.suit}.png`);
		let myMeldings = document.getElementById("myMeldings");
		myMeldings.appendChild(suit);
	}
	writeLog("roundLog", data.player + ' meldet ' + data.suit);
	writeLog("gameLog", data.player + ' meldet ' + data.suit);
})

// when client plays an invalid card, emitted to only one client
socket.on('invalidAction', function(data) {
	writeLog("errorLog", data);
	actionCanBeSent = true;
	addActions('regular');
});

// when client melds an invalid suit, emitted to only one client
socket.on('invalidMelding', function(data) {
	writeLog("errorLog", data);
	addActions('melding');
});

// when client starts the round with an invalid card, emitted to only one client
socket.on('invalidStart', function(data) {
	writeLog("errorLog", data);
	actionCanBeSent = true;
	addActions('start');
});

// when client plays an invalid card in final rounds, emitted to only one client
socket.on('invalidEnd', function(data) {
	writeLog("errorLog", data);
	actionCanBeSent = true;
	addActions('last');
});

// when someone robs the trumpcard, emitted to all clients of the match
socket.on('updateTrumpcard', function(data) {
	if(data.player){
		writeLog("roundLog", data.player + ' holt den Trumpf');
		writeLog("gameLog", data.player + ' holt den Trumpf');
	}
	clear("trumpcard");
	let card = document.createElement('img');
	card.setAttribute('class','trumpcard');
	card.setAttribute('src',`/images/${data.trumpcard.id}.png`);
	let trumpcard = document.getElementById("trumpcard");
	trumpcard.appendChild(card);
	
	clear("talon");
	card = document.createElement('img');
	card.setAttribute('class','talon');
	card.setAttribute('src','/images/back.png');
	let talon = document.getElementById("talon");
	talon.appendChild(card);
});

// when someone plays a card, emitted to all clients of the match
socket.on('cardPlayed', function(data) {
	let card = document.createElement('img');
	card.setAttribute('class','card');

	let id;
	if (data.card){
		id = data.card.id;
		writeLog("roundLog", data.player + ' spielt ' + data.card.suit + ' ' + data.card.rank);
	}else{
		id = 'back';
	}
	card.setAttribute('src',`/images/${id}.png`);
	card.setAttribute('title',data.player);
	let playedCards = document.getElementById("playedCards");
	playedCards.appendChild(card);

});

// when every client played a card in first round, emitted to all clients of the match
socket.on('showCards', function(data) {
	clear("playedCards");
	for (let i = 0; i < data.length; i++){
		let card = document.createElement('img');
		card.setAttribute('class','card');
		card.setAttribute('src',`/images/${data[i].card.id}.png`);
		card.setAttribute('title',data[i].player);
		let playedCards = document.getElementById("playedCards");
		playedCards.appendChild(card);
	}
});

// log the action of the first round, emitted to all clients of the match
socket.on('firstRoundAction', function(data) {
	writeLog("roundLog", data);
});

//when a client disconnected, emitted to all clients of the match
socket.on('playerDisconnected', function(data) {
	removeActions();
	clear("playedCards");
	clear("trumpcard");
	clear("talon");
	clear("myMeldings");
	clear("myScore");
	writeLog("myScore", '0');
	clear("myCards");
	clear("roundLog");
	writeHeader("roundLog","Aktuelle Runde");
	writeLog("gameLog", data + ' hat das Spiel verlassen');
});
