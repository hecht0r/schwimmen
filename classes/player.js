module.exports = class Player {
  constructor(socket) {
    this.socket = socket;
    this.hand = [];
    this.init();
  }

  init(){
    this.meldedSuits = [];		
  }

  emit(event, data){
    this.socket.emit(event, data);
  }
}