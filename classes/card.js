module.exports = class  Card {
    constructor(suit, rank, value) {
        this.id = suit.toLowerCase() + rank.toLowerCase();
		this.suit = suit;
		this.rank = rank;
		this.value = value;
    }
}