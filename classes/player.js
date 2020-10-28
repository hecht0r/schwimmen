module.exports = class Player {
  constructor(socket) {
    this.name = socket.username;
    this.socket = socket;
    this.hand = [];
    this.wins = 0;
    this.init();
  }

  init(){
    this.handValue = 0;
    this.score = 0;
  }

  emit(event, data){
    this.socket.emit(event, data);
  }
}