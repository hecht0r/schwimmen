module.exports = class Player {
  constructor(socket) {
    this.name = socket.username;
    this.socket = socket;
    this.hand = [];
    this.handValue = 0;
    this.score = 3;
  }

  emit(event, data){
    this.socket.emit(event, data);
  }
}