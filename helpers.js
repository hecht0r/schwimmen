module.exports.findPlayerById = function(socketId) {
	for (let i = 0; i < players.length; i++) {
		if (players[i].socket.id === socketId) {
			return players[i];
		}
	}
	return false;
}

module.exports.getNextPlayer = function(player) {
    let index = m.players.indexOf(player);
	if (index == m.players.length-1){
		index = -1;
    }
    return m.players[index + 1];
}