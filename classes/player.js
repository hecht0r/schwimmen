class Player {
    constructor(socket) {
		this.socket = socket;
        this.playerName = socket.username;
        this.hand = [];
		this.score = 0; 			// wird nach team.js übertragen
		this.wonCards = [];			// wird nach team.js übertragen
		this.meldedSuits = [];		// wird nach team.js übertragen
    }
}

module.exports = Player;