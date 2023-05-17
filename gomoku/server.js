const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const cors = require("cors");

app.use(express.json());
app.use(cors());

var playerCount = 0;
var gameCount = 0;
var players = [];

function findPlayer(player) {
  var availablePlayer = players.filter((val)=>{
    return val.state === 0 && val.search && player !== val;
  })
  if (availablePlayer.length > 0) {
    var index = ~~(Math.random() * availablePlayer.length);
    return availablePlayer[index];
  }
  return null;
}

function Player(socket, name) {
  this.socket = socket;
  this.name = name;

  this.search = false;
  this.oplay = null;

  this.color = null;
  this.state = 0;
  // if it is this player's turn.
  this.flag = true;

  playerCount++;

  var self = this;

  this.socket.on("disconnect", ()=>{
    players = players.filter((value)=>{
      return value.name != self.name;
    })
    playerCount--;
    // if this player is playing...
    if (self.state === 1) {
      gameCount--;
    }
    console.log(self.name + " leave the game...");
    self.oplay.socket.emit("iwin"); 
  })

  this.socket.on("play", ()=>{
    self.search = true;
    self.state = 0;
    var opponent = null;
    console.log(self.name + " searching players...");
    if (opponent = findPlayer(self)) {
      console.log(self.name + " find a player " + opponent.name + " !")
      self.oplay = opponent;
      opponent.oplay = self;

      self.state = self.oplay.state = 1;
      self.search = self.oplay.search = false;

      self.color = ~~(Math.random() * 2) === 0 ? "white" : "black";
      self.oplay.color = self.color === "white" ? "black" : "white";

      self.socket.emit("play", {"name": self.oplay.name, "color": self.color});
      self.oplay.socket.emit("play", {"name": self.name, "color": self.oplay.color});
    }
  })

  this.socket.on("cancel", ()=>{
    self.search = false;
    console.log(self.name + " cancel searching...");
  })

  this.socket.on("move", (pos)=>{
    self.oplay.socket.emit("turn", {x: pos.x, y: pos.y});
  })

  this.socket.on("iwin", () => {
    self.oplay.socket.emit("ulose");
  })
}

io.on('connection',function(socket){
  socket.on("enter", (name)=>{
    var flag = players.some((value)=>{
      return value.name === name;
    });
    if (flag) {
      socket.emit("home", {"error": true});
    } else {
      console.log(name + " enter the game...");
      players.push(new Player(socket, name));
      socket.emit("home", {"error": false, "playerCount": playerCount, "name": name});
    }
  })
});

io.on("close", (socket)=>{
  console.log("server close...");
});

http.listen(5000, () => {
  console.log("app listening on port 5000");
});