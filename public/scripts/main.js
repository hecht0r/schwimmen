var socket = io();
var selectedCard;
var selectedMiddleCard;
var actionCanBeSent = false;
var username;
var matchId;
var intervalId;
var autoShoveIntervalId;
var autoKeepIntervalId;
var $window = $(window);

function setUsername() {
	socket.emit('setUsername', $('#name').val());
};

function startGame() {
	socket.emit('startGame',{maxPlayers: 6});
	clear('admin');
}

function write(divID, data){
	let div = document.getElementById(divID);
	div.appendChild(document.createTextNode(data));
	div.appendChild(document.createElement('br'));
	div.scrollTop = div.scrollHeight;
}

function writeBold(divID, data){
	let div = document.getElementById(divID);
	let text = document.createElement('b');
	text.innerHTML = data;
	div.appendChild(text);
	div.appendChild(document.createElement('br'));
	div.scrollTop = div.scrollHeight;
}

function writeError(divID, data){
	let div = document.getElementById(divID);
	let text = document.createElement('b');
	text.innerHTML = data;
	text.style.color = 'red';
	div.appendChild(text);
	div.appendChild(document.createElement('br'));
	div.scrollTop = div.scrollHeight;
}

function clear(divID){
	let div = document.getElementById(divID);
	div.innerHTML = '';
}

function action(action) {
	if (action === 'change' && ((!selectedCard) || (!selectedMiddleCard))){
		writeError('gameLog', 'Bitte Karte auswählen');
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
	let cards = document.getElementById('playerCards').getElementsByTagName('img');;
	for (let i = 0; i < cards.length; i++){
		cards[i].style.border = '2px solid transparent';
	}
	img.style.border = '2px solid red';
	selectedCard = card;
 };   

 function selectMiddleCard(img,card) {
	let cards = document.getElementById('middleCards').getElementsByTagName('img');;
	for (let i = 0; i < cards.length; i++){
		cards[i].style.border = '2px solid transparent';
	}
	img.style.border = '2px solid red';
	selectedMiddleCard = card;
 };   
   
function removeActions() {
	clear('playerActions');
	clearInterval(autoShoveIntervalId);
	clearInterval(autoKeepIntervalId);
}

function addActions(type) {
	clear('playerActions');
	let actions;
	switch(type){
		case 'regular':
			actions = [{ action: 'change', title: 'Tauschen', isClickable: true },{ action: 'shove', title: 'Schieben', isClickable: true },{ action: 'changeAll', title: 'Alle Tauschen', isClickable: true },{ action: 'knock', title: 'Klopfen', isClickable: true }]; 
			break;
		case 'firstMove':
			actions = [{ action: 'keep', title: 'Behalten', isClickable: true },{ action: 'new', title: 'Tauschen', isClickable: true }]; 
			break;
		case 'noKnock':
			actions = [{ action: 'change', title: 'Tauschen', isClickable: true },{ action: 'shove', title: 'Schieben', isClickable: true },{ action: 'changeAll', title: 'Alle Tauschen', isClickable: true },{ action: 'knock', title: 'Klopfen', isClickable: false }]; 
			break;			
		}

	for (let i = 0; i < actions.length; i++) {
		let btn = document.createElement('button');
		btn.innerHTML = actions[i].title;
		if(actions[i].isClickable){
			btn.className = 'button';
			btn.addEventListener('click', function () {
				action(actions[i].action); 
			});
		}else{
			btn.className = 'buttonDisabled';
		}
		let playerActions = document.getElementById('playerActions');
		playerActions.appendChild(btn);
		if (i === 1){
			playerActions.appendChild(document.createElement('br'));
		}
	}
}	

function setCountdown(counter){
	clearInterval(intervalId);
	intervalId = setInterval(function() {
		span = document.getElementById("nextMove");
	  	counter--;
	  	if (counter >= 0) {
		span.innerHTML = 'Neue Runde in ' + counter;
	  	}
	  	if (counter === 0) {
			span.innerHTML = '';
			clearInterval(intervalId);
	  	}
	}, 1000);
  }


function startTimerAutoShove(counter){
	autoShoveIntervalId = setInterval(function() {
		counter--;
		if (counter === 0) {
			action('shove');
		}
	}, 1000);
  }  

function startTimerAutoKeep(counter){
	autoKeepIntervalId = setInterval(function() {
		counter--;
		if (counter === 0) {
			action('keep');
		}
	}, 1000);
  } 

window.onbeforeunload = function() {
	return 'Data will be lost if you leave the page, are you sure?';
};

flexFont = function () {
	var divs = document.querySelectorAll('.gameLog, .standings, .standingsTotal');
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