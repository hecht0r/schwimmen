const card = require('./card.js');

module.exports = class Deck {
	constructor() {
		this.cards = [];   
	}

	createDeck() {
		let ranks = ['Ass', 'Koenig', 'Dame', 'Bube', 'Zehn', 'Neun', 'Acht', 'Sieben'];
		let values = [11, 10, 10, 10, 10, 9, 8, 7];
		for (let i = 0; i < module.exports.suits.length; i++) {
			for (let j = 0; j < ranks.length; j++) {
				this.cards.push(new card(module.exports.suits[i], ranks[j], values[j]));
			}
		}
	}

	shuffleDeck() {
		let location1, location2, tmp;
		for (let i = 0; i < 1000; i++) {
			location1 = Math.floor((Math.random() * this.cards.length));
			location2 = Math.floor((Math.random() * this.cards.length));
			tmp = this.cards[location1];
			this.cards[location1] = this.cards[location2];
			this.cards[location2] = tmp;
		} 
	}
	
	drawCard() {
		return this.cards.splice(0,1)[0];
	}
	
	getCardById(id) {
		return this.cards.filter(card => card.id === id)[0];
	}	
}

module.exports.suits = ['Herz', 'Karo', 'Kreuz', 'Pik'];