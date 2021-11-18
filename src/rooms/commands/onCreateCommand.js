/* eslint-disable import/no-unresolved */
const command = require("@colyseus/command");

module.exports.OnCreateCommand = class OnCreateCommand extends command.Command {
  execute({ maxClients }) {
    this.room.maxClients = maxClients <= 8 && maxClients >= 2 ? maxClients : 8;
    let teams = [];
    this.state.isGameStarted = false;

    let countdown = this.state.timeLimit * 60 || 300;
    this.room.countdownInterval = this.clock.setInterval(() => {
      countdown -= 1;
      if (countdown === 0) {
        console.log("round ended");
        // this.room.dispatcher.dispatch(new RoundEnd());
        // emit round end event
      }
    }, 1000);
    this.room.countdownInterval.pause();
    this.room.onMessage("round-limit", (client, data) => {
      console.log("Setting round limit", data);
      this.state.roundLimit = data;
    });
    this.room.onMessage("time-limit", (client, data) => {
      console.log("Setting time limit", data);
      this.state.timeLimit = data;
    });
    this.room.onMessage("team-limit", (client, data) => {
      console.log("Setting team limit", data);
      this.state.teamLimit = data;
    });
    this.room.onMessage("rusherPerTeam-limit", (client, data) => {
      console.log("Setting rusher per team limit", data);
      this.state.rushersPerTeamLimit = data;
    });
    this.room.onMessage("host-choose-color", (client, data) => {
      this.state.rgb = data; //data is array of rgb values of the color chosen by host
    });
    this.room.onMessage("player-guess-color", (client, data) => {
      this.state.players[client.id].rgb = data; //data is array of rgb values of the color guessed by player
      // calculate score for this player
    });
    this.room.onMessage("give-hints", (client, data) => {
      this.state.hints = data; //data is hint given by host
      console.log("Hints are", this.state.hints);
      this.state.hasGivenHints = true;
    });
    this.room.onMessage("send-message", (client, data) => {
      console.log("Message ", data);
      console.log("Sender ", this.state.players[client.id].username);
      this.state.messages.push(
        `${this.state.players[client.id].username} : ${data}`
      ); //data is hint given by host
    });

    this.room.onMessage("kick", (client, playerId) => {
      if (client.id === this.state.host) {
        const player = this.room.clients.find(
          (clientItem) => clientItem.sessionId === playerId
        );
        player.leave(4000);
      }
    });
    this.room.onMessage("end", (client) => {
      if (client.id === this.state.host) {
        console.log("Ending Game...");
      }
    });
    this.room.onMessage("start", (client, data) => {
      if (client.id === this.state.host) {
        this.state.isGameStarted = data.value;
        console.log("forming teams");
        for (let i = 1; i <= this.state.teamLimit; i++) {
          teams.push([]);
        }
        console.log(teams);
        this.room.broadcast("form-teams", {
          teams: teams,
          maxRusher: this.state.rushersPerTeamLimit,
        });
      }
    });
    this.room.onMessage("teams-formed", (client, msg) => {
      if (client.id === this.state.host) {
        console.log("Ending Game...");
        this.state.hasTeamsFormed = msg;
      }
    });
    this.room.onMessage("join-team", (client, msg) => {
      console.log("Join team ", msg);
      this.state.players[client.id].team = "Team " + msg;
      teams[msg].push(this.state.players[client.id].username);
      this.room.broadcast("join-teams", {
        teams: teams,
        maxRusher: this.state.rushersPerTeamLimit,
      });
    });
    this.room.onMessage("pause", () => {
      this.room.countdownInterval.pause();
    });
    this.room.onMessage("resume", () => {
      this.room.countdownInterval.resume();
    });
  }
};
