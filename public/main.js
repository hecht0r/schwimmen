let socket = io();
var selectedCard;
var actionCanBeSent = true;
var username;
var matchId;

function setUsername() {
	socket.emit('setUsername', $('#name').val());
};

function writeLog(logID, data){
	let log = document.getElementById(logID);
	log.appendChild(document.createTextNode(data));
	log.appendChild(document.createElement("br"));
}

function writeHeader(logID, data){
	let log = document.getElementById(logID);
	let header = document.createElement("div");
	header.setAttribute('class','logHeader');
	header.innerHTML = data;
	log.appendChild(header);
}

function clear(divID){
	let div = document.getElementById(divID);
	div.innerHTML = '';
}

function setSettings(){
	socket.emit('settings', { matchId: matchId, maxPlayers: document.getElementById("maxPlayers").valueAsNumber});
	clear("settings");
}

function action(action) {
	if((actionCanBeSent) && (selectedCard)) {
		actionCanBeSent = false;
		removeActions();
		socket.emit('action', { matchId: matchId, action: action, card: selectedCard });
		selectedCard = false;
		for (let i = 0; i < document.images.length; i++){
			document.images[i].style.border = "2px solid transparent";
		}
	}	
};
 
function selectCard(img,card) {
	for (let i = 0; i < document.images.length; i++){
		document.images[i].style.border = "2px solid transparent";
	}
	img.style.border = "2px solid red";
	selectedCard = card;
 };     

function removeActions() {
	clear("myActions");
	clear("errorLog");
}

function addActions(type) {
	clear("myActions");
	let actions = [];
	switch(type){
		case "start":
			actions = [/*{ action: "forfeit", title: "Karten zurückgeben" },  */
         		       { action: "higher", title: "Höher" }, 
               		   { action: "secondAce", title: "Zweites Ass" }]; 
			break;
		case "regular":
			actions = [{ action: "playCard", title: "Karte spielen" }, 
			           { action: "melding", title: "Melden" }, 
					   { action: "getTrumpcard", title: "Trumpfkarte holen" }];
			break;
		case "last":
			actions = [{ action: "playCardLast", title: "Karte spielen" }, 
			           { action: "melding", title: "Melden" }];
			break;
		}

	for (let i = 0; i < actions.length; i++) {
		let btn = document.createElement('button');
		btn.innerHTML = actions[i].title;
		btn.className = 'actionbutton';
		btn.addEventListener('click', function () {
			action(actions[i].action); 
		});
		let myActions = document.getElementById("myActions");
		myActions.appendChild(btn);
	}
}	

socket.on('userSet', function(data) {
	clear("login");
	document.body.innerHTML	+= 'Hello ' + data.username + '</br>';
	username = data.username;
	matchId = data.matchId;
});

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

socket.on('userJoined', function(data) {
	writeLog("gameLog", data.username + ' betritt das Spiel. ' + data.count );
});

socket.on('newGame', function(data) {
	clear("playedCards");
	clear("trumpcard");
	clear("talon");
	// clear("myMeldings");
	clear("myScore");
	writeLog("myScore", '0');
	clear("gameLog");
	writeHeader("gameLog","Aktuelles Spiel")
	clear("roundLog");
	writeHeader("roundLog","Aktuelle Runde");
	writeLog("roundLog", data + ' beginnt das Spiel');
});

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

socket.on('restart', function() {
	writeLog("gameLog", 'Spiel wird neu gestartet');
});

socket.on('updateScore', function(data) {
	clear("myScore");
	writeLog("myScore", data)
});

socket.on('updateScoreboard', function(data) {
	clear("matchLog");
	writeHeader("matchLog","Spielstand")
	for(let i = 0; i < data.length; i++){
		writeLog("matchLog", data[i].player + ': ' + data[i].score);
	} 
});

socket.on('updateHand', function(data) {
	clear("myCards");
	for (let i = 0; i < data.length; i++) {
		let card = document.createElement('img');
		card.setAttribute('class','card');
		card.setAttribute('src',`/images/${data[i].id}.png`);
		card.setAttribute('onclick','selectCard(this,"' + data[i].id + '")');
		let myCards = document.getElementById("myCards");
		myCards.appendChild(card);
	};
});

socket.on('roundOver', function(data) {
	writeLog("roundLog", data + ' holt den Stich');
	writeLog("gameLog", data + ' holt den Stich');
});		

socket.on('newRound', function(data) {
	clear("playedCards");
	clear("roundLog");
	writeHeader("roundLog","Aktuelle Runde");
});	

socket.on('startGame', function(data) {
	actionCanBeSent = true;
	addActions('start');
});

socket.on('restartGame', function(data) {
	actionCanBeSent = true;
	addActions('start');
});

socket.on('lastRounds', function(data) {
	clear("trumpcard");
	clear("talon");
	writeLog("roundLog", 'Farbe bedienen! Trumpf: ' + data);
	writeLog("gameLog", 'Farbe bedienen! Trumpf: ' + data);
})

socket.on('yourTurn', function() {
	actionCanBeSent = true;
	addActions('regular');
})

socket.on('yourTurnLast', function(data) {
	actionCanBeSent = true;
	addActions('last');
})

socket.on('nextPlayer', function(data) {
	writeLog("roundLog", data + ' ist dran');
});

socket.on('melded', function(data) {
	// if(data.player == username){
	// 	let suit = document.createElement('img');
	// 	suit.setAttribute('src',`/images/${data.suit}.png`);
	// 	let myMeldings = document.getElementById("myMeldings");
	// 	myMeldings.appendChild(suit);
	// }
	writeLog("roundLog", data.player + ' meldet ' + data.suit);
	writeLog("gameLog", data.player + ' meldet ' + data.suit);
})

socket.on('invalidAction', function(data) {
	writeLog("errorLog", data);
	actionCanBeSent = true;
	addActions('regular');
});

socket.on('invalidStart', function(data) {
	writeLog("errorLog", data);
	actionCanBeSent = true;
	addActions('start');
});

socket.on('invalidEnd', function(data) {
	writeLog("errorLog", data);
	actionCanBeSent = true;
	addActions('last');
});

socket.on('updateTrumpcard', function(data) {
	if(data.player){
		writeLog("roundLog", data.player + ' holt den Trumpf');
		writeLog("gameLog", data.player + ' holt den Trumpf');
	}
	clear("trumpcard");
	let card = document.createElement('img');
	card.setAttribute('class','card');
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

socket.on('firstRoundAction', function(data) {
	writeLog("roundLog", data);
});

socket.on('playerDisconnected', function(data) {
	removeActions();
	clear("playedCards");
	clear("trumpcard");
	clear("talon");
	// clear("myMeldings");
	clear("myScore");
	writeLog("myScore", '0');
	clear("myCards");
	clear("roundLog");
	writeHeader("roundLog","Aktuelle Runde");
	writeLog("gameLog", data + ' hat das Spiel verlassen');
});

	window.onbeforeunload = function() {
  return "Data will be lost if you leave the page, are you sure?";
};