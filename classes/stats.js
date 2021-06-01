module.exports = class Stats {
    constructor() {
        this.changed = 0;
        this.changedAll = 0;
        this.shoves = 0;
        this.knocks = 0;
        this.min = 0;
        this.max = 0;
        this.average = 0;
        this.playedRounds = 0;
    }

    setStats(value) {
        this.average = (this.average * this.playedRounds + value) / (this.playedRounds + 1);
        this.playedRounds++;

        if (value > this.max) {
            this.max = value;
        }
        if (value < this.min || this.min == 0) {
            this.min = value;
        }
    }
}