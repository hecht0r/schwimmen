var socket = io();
var selectedCard;
var selectedMiddleCard;
var actionCanBeSent = false;
var username;
var matchId;

var $window = $(window);

function setUsername() {
	socket.emit('setUsername', $('#name').val());
};

function write(logID, data){
	let log = document.getElementById(logID);
	log.appendChild(document.createTextNode(data));
	log.appendChild(document.createElement('br'));
	log.scrollTop = log.scrollHeight;
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
	if (action === 'change' && ((!selectedCard) || (!selectedMiddleCard))){
		clear('errorLog');
		write('errorLog', 'Bitte Karte auswählen');
	}else{
		actionCanBeSent = false;
		removeActions();
		socket.emit('action', { matchId: matchId, action: action, card: selectedCard, middleCard: selectedMiddleCard });
		selectedCard = false;
		selectedMiddleCard = false;
		for (let i = 0; i < document.images.length; i++){
			document.images[i].style.border = '2px solid transparent';
		}
	}
};
 
function selectCard(img,card) {
	let cards = document.getElementById('myCards').getElementsByTagName('img');;
	for (let i = 0; i < cards.length; i++){
		cards[i].style.border = '2px solid transparent';
	}
	img.style.border = '2px solid green';
	selectedCard = card;
 };   

 function selectMiddleCard(img,card) {
	let cards = document.getElementById('middleCards').getElementsByTagName('img');;
	for (let i = 0; i < cards.length; i++){
		cards[i].style.border = '2px solid transparent';
	}
	img.style.border = '2px solid green';
	selectedMiddleCard = card;
 };   

   
function removeActions() {
	clear('myActions');
	clear('errorLog');
}

function addActions(type) {
	clear('myActions');
	let actions;
	switch(type){
		case 'regular':
			actions = [{ action: 'change', title: 'Tauschen' },{ action: 'changeAll', title: 'Alle Tauschen' },{ action: 'shove', title: 'Schieben' },{ action: 'knock', title: 'Klopfen' }]; 
			break;
		case 'firstMove':
			actions = [{ action: 'keep', title: 'Behalten' },{ action: 'new', title: 'Tauschen' }]; 
			break;
		case 'noKnock':
			actions = [{ action: 'change', title: 'Tauschen' },{ action: 'changeAll', title: 'Alle Tauschen' },{ action: 'shove', title: 'Schieben' }]; 
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
	var divs = document.querySelectorAll('.gameLog, .gameScore, .totalScore');
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

$window.keydown(event => {
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (!username && $('#name').val() != ''){ 
		setUsername();
	  }
	}
});