module.exports = class Player {
    constructor(socket) {
        this.socket = socket;
        this.hand = [];
        this.wins = 0;
        this.init();
    }

    init(){
        console.log(this.socket.username + ': init');
        this.handValue = 0;
        this.score = 3;
        this.alive = true;
        this.human = true;
    }

    emit(event, data){
        if (this.human){
          this.socket.emit(event, data);
        } 
    }
}