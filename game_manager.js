const socketio = require('socket.io');
const helper = require('./helpers.js');
const actions = require('./actions.js');
const match = require('./classes/match.js');
const player = require('./classes/player.js');

global.log = true;
global.rooms = [];
global.roundTimeout;

module.exports.listen = function(app) {
    io = socketio.listen(app);
    io.on('connection', function(socket) {

        socket.on('setUsername', function(data) {
            try {
                helper.log(`${data} connected`);
                join(socket, data);
            } catch (e) {
                helper.log(e);
                io.sockets.emit('error');
            }
        });

        socket.on('startGame', function(data) {
            try {
                let m = helper.findMatchBySocketId(socket.id);
                if (m.getNumPlayers() > 1) {
                    m.emitPlayers('gameStarted');
                    m.setSettings(data);
                    setTimeout(function() {
                        m.start();
                    }, 2000);
                } else {
                    socket.emit('setStart');
                }
            } catch (e) {
                helper.log(e);
                io.sockets.emit('error');
            }
        });

        socket.on('action', function(data) {
            try {
                switch (data.action) {
                    case 'keep':
                        actions.keep(socket, data);
                        break;
                    case 'new':
                        actions.new(socket, data);
                        break;
                    case 'change':
                        actions.change(socket, data);
                        break;
                    case 'changeAll':
                        actions.changeAll(socket, data);
                        break;
                    case 'shove':
                        actions.shove(socket, data);
                        break;
                    case 'knock':
                        actions.knock(socket, data);
                        break;
                }
            } catch (e) {
                helper.log(e);
                io.sockets.emit('error');
            }
        });

        socket.on('disconnect', function(reason) {
            try {
                // if our player was part of a match, we kick him from players
                let m = helper.findMatchBySocketId(socket.id);
                if (m) {
                    let player = m.findPlayerById(socket.id);
                    m.players.splice(m.players.indexOf(player), 1);
                    m.emitPlayers('playerDisconnected', socket.username);
                    m.emitPlayers('updateScoreboard', m.getScoreboard());

                    if (m.getNumPlayers() === 1) {
                        // delete match if he was its last player,
                        m.emitPlayers('error');
                        rooms.splice(rooms.indexOf(m), 1);
                    } else {
                        if (m.isRunning() && player.alive) {
                            // start a new game with the remaining players
                            let players = m.players.filter(player => player.alive === true);
                            m.emitPlayers('roundOver');
                            clearTimeout(global.roundTimeout);
                            global.roundTimeout = setTimeout(function() {
                                try {
                                    m.startGame(players, players[Math.floor(Math.random() * players.length)]);
                                } catch (e) {
                                    helper.log(e);
                                    io.sockets.emit('error');
                                }
                            }, 10000);
                        }
                    }
                };
                helper.log(`${socket.username} disconnected because of ` + reason);
            } catch (e) {
                helper.log(e);
                io.sockets.emit('error');
            }
        });
    });
    return io;
}

function join(socket, username) {
    socket.username = username;

    // if there is no match waiting create a new one
    if (!helper.getMatchWaitingForPlayers()) {
        m = new match(helper.createUniqueID());
        rooms.push(m);
    } else {
        m = helper.getMatchWaitingForPlayers();
    }

    let p = new player(socket);
    m.addPlayer(p);
    p.emit('userSet', { username: username, matchId: m.id });

    // first player gets startButton
    if (m.getNumPlayers() === 1) {
        p.emit('setStart');
    }

    setTimeout(function() {
        m.emitPlayers('userJoined', username);
        m.emitPlayers('updateScoreboard', m.getScoreboard());
    }, 1000);
}