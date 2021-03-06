// when client joined a match, emitted to only one client
socket.on('userSet', function(data) {
    username = data.username;
    matchId = data.matchId;
    $('.login.page').fadeOut();
    $('.game.page').show();
    $('.login.page').off('click');
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
});

// when a new game starts, emitted to all clients of the match
socket.on('newGame', function(data) {
    $('.game.page').fadeIn();
    $('.results.page').fadeOut(1000);
    removeActions();
    clear('results');
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
    writeBold('standings', 'Spielstand');
    let score;
    for (let i = 0; i < data.length; i++) {
        if (data[i].score >= 0) {
            score = "I".repeat(data[i].score);
        } else {
            score = data[i].score;
        }
        write('standings', data[i].player + ': ' + score + '  /  ' + data[i].wins + ' Siege');
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

// update clients stats, emitted to one client after another
socket.on('updateStats', function(data) {
    clear('statistics');
    writeBold('statistics', 'Statistik');
    write('statistics', 'Karten getauscht: ' + data.changed);
    write('statistics', 'Alle Karten getauscht: ' + data.changedAll);
    write('statistics', 'Geschoben: ' + data.shoves);
    write('statistics', 'Geklopft: ' + data.knocks);
    write('statistics', 'Höchste Punktzahl: ' + data.max);
    write('statistics', 'Niedrigste Punktzahl: ' + data.min);
    write('statistics', 'Durchschnittspunktzahl: ' + data.average.toFixed(2));
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
        if (!isMute) {
            myAudio = new Audio('/audio/knock.mp3').play();
        }
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
    // show results in log
    for (let i = 0; i < data.length; i++) {
        writeBold('gameLog', data[i].player + ': ' + data[i].handValue)


        // create content for results page
        let result = document.getElementById('results');
        let fldst = document.createElement("FIELDSET");
        fldst.setAttribute('class', 'hand');

        for (let j = 0; j < data[i].hand.length; j++) {
            let card = document.createElement('img');
            card.setAttribute('class', 'card');
            card.setAttribute('src', `/images/cards/${data[i].hand[j].id}.jpg`);
            fldst.appendChild(card);
        };
        let lgnd = document.createElement("LEGEND");
        lgnd.innerHTML = data[i].player + ': ' + data[i].handValue;
        fldst.appendChild(lgnd);

        result.appendChild(fldst);
    };
    $('.game.page').fadeOut(1000);
    $('.results.page').fadeIn(1000);
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

        let div = document.getElementById('playerCards');
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
    let div = document.getElementById('nextMove');
    let text = document.createElement('b');

    if (data == username) {
        text.innerHTML = 'Du bist dran';
        text.style.color = 'red';
    } else {
        text.innerHTML = data + ' ist dran';
    }
    div.appendChild(text);
});

// when a client disconnected, emitted to all clients of the match
socket.on('playerDisconnected', function(data) {
    write('gameLog', data + ' hat das Spiel verlassen');
});

// application error
socket.on('error', function() {
    writeError('gameLog', 'Anwendungsfehler - bitte Seite neu laden');
});