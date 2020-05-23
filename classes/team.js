const helper = require('./../helpers.js'); 

module.exports = class Team {
    constructor() {
        this.players = [];
        this.wins = 0;
        this.init()
    }

    init(){
        this.score = 0;
        this.wonCards = [];
        this.captainIndex = Math.floor(Math.random() * this.players.length); // for updating score in kreuzgaigel
      }

    addPlayer(player){
        this.players.push(player);
    }

    setName(){
        if (this.players.length == 1){
            this.name = this.players[0].name;
        }else{
            this.name = this.players[0].name + '/' + this.players[1].name;
        }
    }  

    emitPlayers(event, data) {
        if(event==='updateScore'){
            helper.findPlayerBySocketId(this.players[this.captainIndex].id).emit(event, data);
        }else{
            for (let i = 0; i < this.players.length; i++) {
                helper.findPlayerBySocketId(this.players[i].id).emit(event, data);
		    }
        }
    }
};   