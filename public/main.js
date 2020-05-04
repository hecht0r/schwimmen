let socket = io();
var selectedCard;
var actionCanBeSent = true;
var actions = [{ action: "playCard", title: "Karte spielen" }, 
               { action: "melding", title: "Melden" }, 
               { action: "getTrumpcard", title: "Trumpfkarte holen" }] 
					
function setUsername() {
	socket.emit('setUsername', $('#name').val());
};

function validateAction(action) {
	if((actionCanBeSent) && (selectedCard)) {
		console.log('validateAction');
		actionCanBeSent = false;
		removeActions();
		socket.emit('validateAction', { action: action, card: selectedCard });
	}	
};

function selectCard(img,card) {
	for (let i = 0; i < document.images.length; i++){
		document.images[i].style.border = "";
	}
	img.style.border = "2px solid red";
	selectedCard = card;
};     

function removeActions() {
	let myActions = document.getElementById("myActions");
	myActions.innerHTML = '';
}

function addActions() {
	let myActions = document.getElementById("myActions");
	myActions.innerHTML = '';
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
	document.body.innerHTML	 += 'Hello ' + data.username + '</br>';
});

socket.on('new Game', function(data) {
	let myMeldings = document.getElementById("myMeldings");
	myMeldings.innerHTML = '';
});

socket.on('updateTrumpcard', function(data) {
	let trumpcard = document.getElementById("trumpcard");
	let card = document.createElement('img');
	card.setAttribute('class','playercard');
	card.setAttribute('src','/images/' + data.id + '.png');
	trumpcard.appendChild(card);
});

socket.on('updateScore', function(data) {
	let myScore = document.getElementById("myScore");
	myScore.innerHTML = '';
	let score = document.createTextNode(data);
	myScore.appendChild(score);
});

socket.on('updateHand', function(data) {
	let myCards = document.getElementById("myCards");
	myCards.innerHTML = '';
	for (let i = 0; i < data.length; i++) {
		let card = document.createElement('img');
		card.setAttribute('class','playercard');
		card.setAttribute('src','/images/' + data[i].id + '.png');
		card.setAttribute('onclick','selectCard(this,"' + data[i].id + '")');
		myCards.appendChild(card);
	};
});

socket.on('start_game', function(data) {
	document.body.innerHTML += '</br>Du beginnst';
	for (let i = 0; i < data.length; i++) {
		let btn = document.createElement('button');
		btn.innerHTML = data[i];
		btn.addEventListener('click', function () {
			validateAction(data[i]);
		});
		btn.className = 'actionbutton';
		document.body.append(btn);
	}	
});

socket.on('newRound', function() {
	let playedCards = document.getElementById("playedCards");
	playedCards.innerHTML = '';
});	

socket.on('bc_start_game', function(data) {
	document.body.innerHTML += '</br>' + data + ' beginnt';
});

socket.on('yourTurn', function() {
	actionCanBeSent = true;
	addActions();
})

socket.on('melded', function(data) {
	let myMeldings = document.getElementById("myMeldings");
	let suit = document.createElement('img');
	suit.setAttribute('src','/images/' + data + '.png');
	myMeldings.appendChild(suit);
})
//test
socket.on('invalidCard', function() {
	actionCanBeSent = true;
	addActions();
	let errortext = document.createTextNode("invalid Card");
	document.body.appendChild(errortext);   
});

socket.on('updateTrump', function(data) {
	let trumpcard = document.getElementById("trumpcard");
 	trumpcard.innerHTML = '';
	let card = document.createElement('img');
	card.setAttribute('class','playercard');
	card.setAttribute('src','/images/' + data.id + '.png');
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
	card.setAttribute('src','/images/' + id + '.png');
	playedCards.appendChild(card);
});

	window.onbeforeunload = function() {
  return "Data will be lost if you leave the page, are you sure?";
};