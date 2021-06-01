const helper = require('./helpers.js');
const deck = require('./classes/deck.js');
const card = require('./classes/card.js');

let d = new deck();
d.createDeck();
// data: matchId, action, card, middleCard

module.exports.change = function(socket, data) {
    let m = helper.findMatchById(data.matchId);
    let g = m.getCurrentGame();
    let player = m.findPlayerById(socket.id);

    player.stats.changed++;
    g.shoveCount = 0;
    g.moveCount++;

    let playerIndex = player.hand.findIndex(c => c.id === data.card);
    let middleIndex = g.middleCards.findIndex(c => c.id === data.middleCard);

    // move selected playerCard to middleCards
    let playerCard = d.getCardById(data.card);
    g.middleCards.splice(middleIndex, 0, playerCard);
    player.hand = helper.removeCard(player.hand, playerCard);

    // append selected middleCard to playerCards
    let middleCard = d.getCardById(data.middleCard);
    player.hand.splice(playerIndex, 0, middleCard);
    g.middleCards = helper.removeCard(g.middleCards, middleCard);

    let logText = player.socket.username + ' tauscht';
    m.emitPlayers('move', logText);
    helper.log(logText)
    endMove(socket, data);
}


module.exports.changeAll = function(socket, data) {
    let m = helper.findMatchById(data.matchId);
    let g = m.getCurrentGame();
    let player = m.findPlayerById(socket.id);

    player.stats.changedAll++;
    g.shoveCount = 0;
    g.moveCount++;

    // change playerCards with middleCards	
    let cards = g.middleCards;
    g.middleCards = player.hand;
    player.hand = cards;

    let logText = player.socket.username + ' tauscht alle';
    m.emitPlayers('move', logText);
    helper.log(logText)
    endMove(socket, data);
}

module.exports.shove = function(socket, data) {
    let m = helper.findMatchById(data.matchId);
    let g = m.getCurrentGame();
    let player = m.findPlayerById(socket.id);

    player.stats.shoves++;
    g.shoveCount++;
    g.moveCount++;

    let logText = player.socket.username + ' schiebt';
    m.emitPlayers('move', logText);
    helper.log(logText)

    // if everyone shoved, get new middleCards
    if (g.shoveCount === g.players.length) {
        g.shoveCount = 0;
        Array.prototype.push.apply(g.deck.cards, g.middleCards);
        g.middleCards = [];
        g.middleCards = g.deck.cards.splice(0, 3);
        m.emitPlayers('newMiddlecards');
    }

    endMove(socket, data);
}

module.exports.knock = function(socket, data) {
    let m = helper.findMatchById(data.matchId);
    let g = m.getCurrentGame();
    let player = m.findPlayerById(socket.id);

    player.stats.knocks++;
    g.moveCount++;
    g.shoveCount = 0;

    // (players.length - 1) moves till round ends
    g.knockCount = g.moveCount + g.players.length - 1;

    let logText = player.socket.username + ' klopft';
    m.emitPlayers('move', logText);
    helper.log(logText)
    endMove(socket, data);
}

module.exports.keep = function(socket, data) {
    let m = helper.findMatchById(data.matchId);
    let g = m.getCurrentGame();
    let player = m.findPlayerById(socket.id);

    g.moveCount++;

    // deal middlecards
    g.middleCards = g.deck.cards.splice(0, 3);
    g.emitPlayers('updateMiddlecards', g.middleCards);

    let logText = player.socket.username + ' behält seine Karten';
    m.emitPlayers('move', logText);
    helper.log(logText)
    endMove(socket, data);
}

module.exports.new = function(socket, data) {
    let m = helper.findMatchById(data.matchId);
    let g = m.getCurrentGame();
    let player = m.findPlayerById(socket.id);

    g.moveCount++;
    g.middleCards = g.deck.cards.splice(0, 3);

    // change playerCards with middleCards	
    let cards = g.middleCards;
    g.middleCards = player.hand;
    player.hand = cards;

    let logText = player.socket.username + ' tauscht seine Karten';
    m.emitPlayers('move', logText);
    helper.log(logText)
    endMove(socket, data);
}

endMove = function(socket, data) {
    let m = helper.findMatchById(data.matchId);
    let g = m.getCurrentGame();
    let player = m.findPlayerById(socket.id);

    player.stats.played++;
    player.handValue = helper.handValue(player.hand);

    player.emit('updateHand', player.hand);
    player.emit('updateStats', player.stats);
    g.emitPlayers('updateMiddlecards', g.middleCards);


    if (player.handValue >= 31 || ((g.knockCount === g.moveCount) && g.knockCount > 0)) {
        g.end(player);
    } else {
        let nextPlayer = g.getNextPlayer(player);

        if ((g.moveCount < g.players.length) || (g.knockCount > 0)) {
            nextPlayer.emit('yourTurnNoKnock');
        } else {
            nextPlayer.emit('yourTurn');
        }
        m.emitPlayers('nextPlayer', nextPlayer.socket.username);
    }
}