class Card {
    constructor(suit, rank, value) {
        this.id = suit.substr(0,1) + rank.substr(0,1);
		this.suit = suit;
		this.rank = rank;
		this.value = value;
    }
}



module.exports = Card;