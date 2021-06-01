const helper = require('./../helpers.js');
const deck = require('./deck.js');
const action = require('./../actions.js');

module.exports = class Game {
    constructor(players) {
        this.players = players.slice();
        this.shoveCount = 0;
        this.knockCount = 0;
        this.moveCount = 0;
    }

    getNextPlayer(player) {
        let index = this.players.indexOf(player);
        if (index == this.players.length - 1) {
            index = -1;
        }
        return this.players[index + 1];
    }

    emitPlayers(event, data) {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].emit(event, data);
        }
    }

    start(starter) {
        // start game, create deck and deal cards
        let m = helper.findMatchBySocketId(starter.socket.id);
        helper.log('---');
        helper.log(starter.socket.username + ' beginnt.')
        m.emitPlayers('newGame', starter.socket.username);
        m.emitPlayers('updateScoreboard', m.getScoreboard());
        this.starter = starter;
        this.deck = new deck();
        this.deck.createDeck();
        this.deck.shuffleDeck();


        // hand out cards and tell the players' client
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            player.hand = this.deck.cards.splice(0, 3);
            player.handValue = helper.handValue(player.hand);
            player.emit('updateHand', player.hand);
        }

        // check if someone has already >= 31 handvalue
        let startRound = true;
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            if (player.handValue >= 31) {
                startRound = false;
                this.end(player);
            }
        }
        if (startRound) {
            this.starter.emit('yourStartTurn');
        }
    }

    async end(winner) {
        let m = helper.findMatchBySocketId(winner.socket.id);

        m.emitPlayers('roundOver');

        // tell scores to everyone
        let results = [];
        for (let i = 0; i < this.players.length; i++) {
            results.push({ player: this.players[i].socket.username, handValue: this.players[i].handValue, hand: this.players[i].hand });
            helper.log(this.players[i].socket.username + ': ' + this.players[i].handValue);
            this.players[i].stats.setStats(this.players[i].handValue);
            this.players[i].emit('updateStats', this.players[i].stats);
        }
        m.emitPlayers('results', results);

        // find and tell losers to everyone
        let losers;
        if (winner.handValue === 33) {
            losers = this.players.filter(p => (p != winner));
        } else {
            let players = this.players.slice();
            players.sort((a, b) => (a.handValue > b.handValue) ? 1 : ((b.handValue > a.handValue) ? -1 : 0));
            losers = this.players.filter(p => (p.handValue === players[0].handValue));
        }

        let swimmersCount = losers.filter(p => (p.score === 0)).length;
        let playersCount = this.players.length;
        for (let i = 0; i < losers.length; i++) {
            let loser = losers[i];
            loser.score -= 1;
            helper.log(`${loser.socket.username} verliert!`);
            m.emitPlayers('losers', loser.socket.username);

            // check if players swim
            if (loser.score === 0) {
                m.emitPlayers('swim', loser.socket.username);
            }

            // check if players have to leave the game
            if (loser.score < 0) {
                // replay round if all remaining players are swimmers and losers
                if (playersCount === swimmersCount) {
                    loser.score++;
                    loser.emit('replay');
                } else {
                    loser.alive = false;
                    loser.score = '†';
                    m.emitPlayers('out', loser.socket.username);
                    let index = this.players.indexOf(loser);
                    if (index > -1) {
                        this.players.splice(index, 1);
                    }
                }
            }
        }

        let players;
        let timeout = 10000;
        if (this.players.length === 1) {
            // game is over, so raise winners wincount, reset all playerscores and start new round
            m.emitPlayers('winner', this.players[0].socket.username)
            players = m.players;
            let winnerIndex = players.indexOf(this.players[0]);
            players[winnerIndex].wins++;
            for (let i = 0; i < players.length; i++) {
                players[i].init();
            }
            global.roundTimeout = await new Promise(r => setTimeout(r, timeout));
            timeout = 0;
            m.emitPlayers('gameOver');
        } else {
            // game is not over, so start new round with all players alive
            players = m.players.filter(player => player.alive === true);
        }

        let nextStarter = this.getNextPlayer(this.starter);

        m.emitPlayers('updateScoreboard', m.getScoreboard());

        global.roundTimeout = setTimeout(function() {
            m.startGame(players, nextStarter);
        }, timeout);
    }
}