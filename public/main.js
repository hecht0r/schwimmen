let socket = io();
var selectedCard;
var actionCanBeSent = true;
var username;
			   
function setUsername() {
	socket.emit('setUsername', $('#name').val());
};

function writeLog(logID, data){
	let log = document.getElementById(logID);
	log.appendChild(document.createTextNode(data));
	log.appendChild(document.createElement("br"));
}

function clear(divID){
	let div = document.getElementById(divID);
	div.innerHTML = '';
}

function validateAction(action) {
	if((actionCanBeSent) && (selectedCard)) {
		actionCanBeSent = false;
		removeActions();
		socket.emit('validateAction', { action: action, card: selectedCard });
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
			actions = [ /* { action: "forfeit", title: "Drei 7er" }, */ 
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
			validateAction(actions[i].action); 
		});
		myActions.appendChild(btn);
	}
}	

socket.on('userExists', function(data) {
	document.getElementById('error-container').innerHTML = data;
});

socket.on('userSet', function(data) {
	clear("login");
	document.body.innerHTML	+= 'Hello ' + data.username + '</br>';
	username = data.username;
});

socket.on('newGame', function(data) {
	clear("playedCards");
	clear("trumpcard");
	clear("myMeldings");
	clear("myScore");
	writeLog("myScore", '0');
	clear("gameLog");
	writeLog("gameLog", data + ' beginnt das Spiel');
});

socket.on('gameOver', function(data) {
	writeLog("gameLog", data + ' gewinnt das Spiel');
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
	for(let i = 0; i < data.length; i++){
		writeLog("matchLog", data[i].player + ': ' + data[i].score);
	} 
});

socket.on('updateHand', function(data) {
	clear("myCards");
	for (let i = 0; i < data.length; i++) {
		let card = document.createElement('img');
		card.setAttribute('class','playercard');
		card.setAttribute('src',`/images/${data[i].id}.png`);
		card.setAttribute('onclick','selectCard(this,"' + data[i].id + '")');
		myCards.appendChild(card);
	};
});

socket.on('newRound', function(data) {
	writeLog("gameLog", data + ' holt den Stich');
	clear("playedCards");
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

socket.on('melded', function(data) {
	if(data.player == username){
		let myMeldings = document.getElementById("myMeldings");
		let suit = document.createElement('img');
		suit.setAttribute('src',`/images/${data.suit}.png`);
		myMeldings.appendChild(suit);
	}else{
		writeLog("gameLog", data.player + ' meldet ' + data.suit);
	}
	
})

socket.on('invalidAction', function() {
	writeLog("errorLog", 'nope');
	actionCanBeSent = true;
	addActions('regular');
});

socket.on('invalidStart', function() {
	writeLog("errorLog", 'nope');
	actionCanBeSent = true;
	addActions('start');
});

socket.on('invalidEnd', function() {
	writeLog("errorLog", 'nope');
	actionCanBeSent = true;
	addActions('last');
});

socket.on('updateTrumpcard', function(data) {
	if(data.player){
		writeLog("gameLog", data.player + ' holt den Trumpf');
	}
	clear("trumpcard");
	let card = document.createElement('img');
	card.setAttribute('class','playercard');
	card.setAttribute('src',`/images/${data.trumpcard.id}.png`);
	trumpcard.appendChild(card);
});

socket.on('cardPlayed', function(data) {
	let playedCards = document.getElementById("playedCards");
	let card = document.createElement('img');
	card.setAttribute('class','playercard');

	let id;
	if (data.card){
		id = data.card.id;
	}else{
		id = 'back';
	}
	card.setAttribute('src',`/images/${id}.png`);
	card.setAttribute('title',data.player);
	playedCards.appendChild(card);
});

socket.on('showCards', function(data) {
	clear("playedCards");
	for (let i = 0; i < data.length; i++){
		let card = document.createElement('img');
		card.setAttribute('class','playercard');
		card.setAttribute('src',`/images/${data[i].card.id}.png`);
		card.setAttribute('title',data[i].player);
		playedCards.appendChild(card);
	}
});

socket.on('firstRoundAction', function(data) {
	writeLog("gameLog", data);
});

	window.onbeforeunload = function() {
  return "Data will be lost if you leave the page, are you sure?";
};