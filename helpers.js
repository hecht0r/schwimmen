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

module.exports.findMatchById = function(matchId) {
	for (let i = 0; i < rooms.length; i++) {
		if (rooms[i].id === matchId) {
			return rooms[i];
		}
	}
	return false;
}

module.exports.findMatchByTeam = function(team) {
	for (let i = 0; i < rooms.length; i++) {
		if (rooms[i].teams.indexOf(team) > -1) {
			return rooms[i];
		}
	}
	return false;
}

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

module.exports.removeCardFromHand = function(cards, card) {
	// find given card and remove it from given cards
	cards.splice(cards.findIndex(c => c.id == card.id), 1 );
	return cards;
}

module.exports.createUniqueID = function(){
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	  });
}

module.exports.getMatchWaitingForPlayers = function(){
	for (let i = 0; i < rooms.length; i++){
		if (rooms[i].isWaiting()){
			return rooms[i];
		}
	}
	return false;
}