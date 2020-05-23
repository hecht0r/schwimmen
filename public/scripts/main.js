var socket = io();
var selectedCard;
var actionCanBeSent = false;
var username;
var matchId;

function setUsername() {
	socket.emit('setUsername', $('#name').val());
};

function write(logID, data){
	let log = document.getElementById(logID);
	log.appendChild(document.createTextNode(data));
	log.appendChild(document.createElement('br'));
}

function writeHeader(logID, data){
	let log = document.getElementById(logID);
	let header = document.createElement('div');
	header.setAttribute('class','logHeader');
	header.innerHTML = data;
	log.appendChild(header);
}

function clear(divID){
	let div = document.getElementById(divID);
	div.innerHTML = '';
}

function show(divID){
	let div = document.getElementById(divID);
	div.style='visibility: visible';
}

function setSettings(){
	socket.emit('settings', { matchId: matchId, maxPlayers: document.getElementById('maxPlayers').valueAsNumber});
	clear('settings');
}

function action(action) {
	if(((selectedCard) || action === 'forfeit')) {
		actionCanBeSent = false;
		removeActions();
		socket.emit('action', { matchId: matchId, action: action, card: selectedCard });
		selectedCard = false;
		for (let i = 0; i < document.images.length; i++){
			document.images[i].style.border = '2px solid transparent';
		}
	}else{
		clear('errorLog');
		write('errorLog', 'Bitte Karte auswählen');
	}	
};
 
function selectCard(img,card) {
	for (let i = 0; i < document.images.length; i++){
		document.images[i].style.border = '2px solid transparent';
	}
	img.style.border = '2px solid green';
	selectedCard = card;
 };   
 
 function playCard(img,card) {
	 if(actionCanBeSent){
		 actionCanBeSent = false;
		for (let i = 0; i < document.images.length; i++){
			document.images[i].style.border = '2px solid transparent';
		}
		removeActions();
		socket.emit('action', { matchId: matchId, action: 'playCard', card: card });
	}
};

function removeActions() {
	clear('myActions');
	clear('errorLog');
}

function addActions(type) {
	// clear('myActions');
	let actions = [];
	switch(type){
		case 'forfeit':
			actions = [{ action: 'forfeit', title: 'Karten zurückgeben' }]; 
			break;
		case 'start':
			actions = [	{ action: 'higher', title: 'Höher' },{ action: 'secondAce', title: 'Zweites Ass' },{ action: 'startOpen', title: 'Offen spielen' }]; 
			break;
		case 'regular':
			actions = [{ action: 'playCard', title: 'Karte spielen' },{ action: 'getTrumpcard', title: 'Trumpfkarte holen' },{ action: 'melding', title: 'Melden' }];
			break;
		case 'last':
			actions = [{ action: 'playCardLast', title: 'Karte spielen' }];
			break;
		}

	for (let i = 0; i < actions.length; i++) {
		let btn = document.createElement('button');
		btn.innerHTML = actions[i].title;
		btn.className = 'actionbutton';
		btn.addEventListener('click', function () {
			action(actions[i].action); 
		});
		let myActions = document.getElementById('myActions');
		myActions.appendChild(btn);
	}
}	

window.onbeforeunload = function() {
	return 'Data will be lost if you leave the page, are you sure?';
};

flexFont = function () {
	var divs = document.querySelectorAll('.roundLog, .gameLog, .matchLog');
    for(var i = 0; i < divs.length; i++) {
        var relFontsize = divs[i].offsetWidth*0.05;
        divs[i].style.fontSize = relFontsize+'px';
    }
};

window.onload = function(event) {
    flexFont();
};
window.onresize = function(event) {
    flexFont();
};