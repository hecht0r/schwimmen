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

// find the match with the given [team]
module.exports.findMatchByTeam = function(team) {
	for (let i = 0; i < rooms.length; i++) {
		if (rooms[i].teams.indexOf(team) > -1) {
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
module.exports.removeCardFromHand = function(cards, card) {
	cards.splice(cards.findIndex(c => c.id == card.id), 1 );
	return cards;
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