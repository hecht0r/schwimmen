// find the [match] the emitting player is participating
module.exports.findMatchBySocketId = function(socketId) {
	for (let i = 0; i < rooms.length; i++) {
		for (let j = 0; j < rooms[i].players.length; j++) {
            if (rooms[i].players[j].socket.id === socketId) {
                return rooms[i];
			}
		}
	}
	return false;
}

// find the [match] with the given matchID
module.exports.findMatchById = function(matchId) {
	for (let i = 0; i < rooms.length; i++) {
		if (rooms[i].id === matchId) {
			return rooms[i];
		}
	}
	return false;
}


// find the [player] with the given player's socketID
module.exports.findPlayerBySocketId = function(socketId) {
	for (let i = 0; i < rooms.length; i++) {
		for (let j = 0; j < rooms[i].players.length; j++) {
            if (rooms[i].players[j].socket.id === socketId) {
                return rooms[i].players[j];
			}
		}
	}
	return false;
}

// find given card and remove it from given cards
module.exports.removeCard = function(cards, card) {
	cards.splice(cards.findIndex(c => c.id == card.id), 1 );
	return cards;
}

// gives value of given cards
module.exports.handValue = function(cards) {
	
	let dups = [];
	for (let i = 0; i < cards.length; i++) {
	  if (cards.filter(c => [cards[i].suit].indexOf(c.suit) != -1).length > 1) {
		dups.push(cards[i]);
	  }
	}
	if (dups.length > 0){
		// if a suit exists more than once, sum their values
		return(module.exports.getCardsValue(dups));
	}else{
		// if not...check if a rank exists three times
		if ((cards.filter(c => [cards[0].rank].indexOf(c.rank) > -1)).length === 3){
			if (cards[0].value === 11){
				return 33;
			}else{
				return 30.5;
			}
		}else{
			cards.sort((a,b) => (a.value < b.value) ? 1 : ((b.value < a.value) ? -1 : 0)); 
			return cards[0].value;
		}
	}
}

// create UUID for Matches
module.exports.createUniqueID = function(){
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	  });
}

// find next [match] which is waiting for players to join
module.exports.getMatchWaitingForPlayers = function(){
	for (let i = 0; i < rooms.length; i++){
		if (rooms[i].isWaiting()){
			return rooms[i];
		}
	}
	return false;
}

// calculate total value of given cards
module.exports.getCardsValue = function(cards){
	let total = 0
	for (let i = 0; i < cards.length; i++) {
		if(cards[i].card){
			total += cards[i].card.value;
		}else{
			total += cards[i].value;
		}
	}
	return total;
}