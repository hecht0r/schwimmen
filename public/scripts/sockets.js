// when client joined a match, emitted to only one client
socket.on('userSet', function(data) {
    username = data.username;
    matchId = data.matchId;
    $('.login.page').fadeOut();
    $('.game.page').show();
    $('.login.page').off('click');
    document.body.appendChild(document.createTextNode('Hello ' + data.username));
});

// first client can start game, emitted to only one client
socket.on('setStart', function() {
    let div = document.getElementById('admin');
    let btn = document.createElement('button');
    btn.id = 'adminbutton'
    btn.innerHTML = 'Start game';
    btn.className = 'adminbutton';
    btn.addEventListener('click', function() {
        startGame();
        return false;
    });
    div.appendChild(btn);
});

// when someone joined the match, emitted to all clients of the match
socket.on('userJoined', function(data) {
    write('gameLog', data + ' betritt das Spiel.');
});

// when start button was pushed
socket.on('gameStarted', function() {
    clear('nextMove');
    setCountdown(10);
});

// when a new game starts, emitted to all clients of the match
socket.on('newGame', function(data) {
    removeActions();
    clear('middleCards');
    clear('nextMove');
    write('gameLog', '------------------');
    write('gameLog', data + ' beginnt das Spiel');

    // init middleCards
    let card;
    let middleCards = document.getElementById('middleCards');
    for (let i = 0; i < 3; i++) {
        card = document.createElement('img');
        card.setAttribute('class', 'card');
        card.setAttribute('src', `/images/cards/back.png`);
        middleCards.appendChild(card);
    };
});

// update standings, emitted to all clients of the match   
socket.on('updateScoreboard', function(data) {
    clear('standings');
    clear('standingsTotal');
    let columns;
    if (data.length > 4) {
        columns = "2";
    } else {
        columns = "1";
    }

    document.getElementById('standings').style.columnCount = columns;
    document.getElementById('standingsTotal').style.columnCount = columns;

    let score;
    for (let i = 0; i < data.length; i++) {
        if (data[i].score >= 0) {
            score = "I".repeat(data[i].score);
        } else {
            score = data[i].score;
        }
        write('standings', data[i].player + ': ' + score);
        write('standingsTotal', data[i].player + ': ' + data[i].wins);
    }
});

// update clients cards, emitted to one client after another
socket.on('updateHand', function(data) {
    clear('playerCards');
    for (let i = 0; i < data.length; i++) {
        let card = document.createElement('img');
        card.setAttribute('class', 'card');
        card.setAttribute('src', `/images/cards/${data[i].id}.jpg`);
        card.setAttribute('onclick', 'selectCard(this,"' + data[i].id + '")');
        let myCards = document.getElementById('playerCards');
        myCards.appendChild(card);
    };
});

// update game cards
socket.on('updateMiddlecards', function(data) {
    clear('middleCards');
    let card;
    let middleCards = document.getElementById('middleCards');
    for (let i = 0; i < data.length; i++) {
        card = document.createElement('img');
        card.setAttribute('class', 'card');
        card.setAttribute('src', `/images/cards/${data[i].id}.jpg`);
        card.setAttribute('onclick', 'selectMiddleCard(this,"' + data[i].id + '")');
        middleCards.appendChild(card);
    };
    card = document.createElement('img');
    card.setAttribute('class', 'card');
    card.setAttribute('src', `/images/cards/back.png`);
    middleCards.appendChild(card);
})

// show move in log
socket.on('move', function(data) {
    if (data.includes('klopft')) {
        writeBold('gameLog', data);
    } else {
        write('gameLog', data);
    }
})

// round is over
socket.on('roundOver', function(data) {
    removeActions();
    clear('nextMove');
    setCountdown(10);
})

// everyone shoved -> new middleCards
socket.on('newMiddlecards', function(data) {
    write('gameLog', 'Neue Karten in der Mitte');
})

// game is over
socket.on('gameOver', function(data) {
    clear('gameLog');
})

// gameresults
socket.on('results', function(data) {
    writeBold('gameLog', data.player + ': ' + data.score)
})

// show roundlosers in log
socket.on('losers', function(data) {
    write('gameLog', data + ' verliert');
})

// show swimmers in log
socket.on('swim', function(data) {
    writeBold('gameLog', data + ' schwimmt')
})

// show gamewinner in log
socket.on('winner', function(data) {
    writeBold('gameLog', data + ' gewinnt das Spiel')
})

// show replaymessage in log
socket.on('replay', function(data) {
    writeBold('gameLog', 'Runde wird erneut gespielt')
})

// if a player is out, remove cards
socket.on('out', function(data) {

    if (data == username) {
        writeError('gameLog', 'Du bist raus');
        removeActions();
        clear('middleCards');
        clear('playerCards');
        clear('nextMove');

        let div = document.getElementById('middleCards');
        img = document.createElement('img');
        img.setAttribute('class', 'gameover');
        img.setAttribute('src', '/images/gameover.png');
        div.appendChild(img);
    } else {
        writeBold('gameLog', data + ' ist raus');
    }
})

// when it's clients turn to start, emitted to starter only
socket.on('yourStartTurn', function() {
    actionCanBeSent = true;
    addActions('firstMove');
    startTimerAutoKeep(60);
})

// when it's clients turn to start, emitted to starter only
socket.on('yourTurnNoKnock', function() {
    actionCanBeSent = true;
    addActions('noKnock');
    startTimerAutoShove(60);
})

// when it's clients turn to play, emitted to one client after another
socket.on('yourTurn', function() {
    actionCanBeSent = true;
    addActions('regular');
    startTimerAutoShove(60);
})

// tell all players whos turn it is, emitted to all clients of the game
socket.on('nextPlayer', function(data) {
    clear('nextMove');
    if (data == username) {
        write('nextMove', 'Du bist dran');
    } else {
        write('nextMove', data + ' ist dran');
    }
});

// when a client disconnected, emitted to all clients of the match
socket.on('playerDisconnected', function(data) {
    write('gameLog', data + ' hat das Spiel verlassen');
});

// application error
socket.on('error', function() {
    writeError('gameLog', 'Anwendungsfehler - bitte Seite neu laden');
});