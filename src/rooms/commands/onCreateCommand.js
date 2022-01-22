/* eslint-disable import/no-unresolved */
const command = require("@colyseus/command");

module.exports.OnCreateCommand = class OnCreateCommand extends command.Command {
  execute({ maxClients }) {
    this.room.maxClients = maxClients + 1;
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
    // this.room.onMessage("round-limit", (client, data) => {
    //   console.log("Setting round limit", data);
    //   this.state.roundLimit = data;
    // });
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
      this.state.rushersPerTeamLimit = data + 1;
    });
    this.room.onMessage("host-choose-color", (client, data) => {
      this.state.rgb = data; //data is array of rgb values of the color chosen by host
    });
    this.room.onMessage("player-guess-color", (client, data) => {
      this.state.players[client.id].rgb = data; //data is array of rgb values of the color guessed by player
      // calculate score for this player
    });
    this.room.onMessage("new-hint", (client, hint) => {
      // this.state.players[client.id].rgb = data;
      // if (
      //   this.state.hints.findIndex(
      //     (x) => x.trim().toUpperCase() === hint.trim().toUpperCase()
      //   ) === -1 &&
      //   hint.trim().toUpperCase().split(" ").length <= 3
      // ) {
      //   this.state.hints.push(hint.trim().toUpperCase());
      //   // setHints((prevVal) => [...prevVal, hint.trim().toUpperCase()]);
      // }
      this.state.hints.push(hint?.trim().toUpperCase());
      this.room.broadcast("set-hints", {
        hints: this.state.hints,
      });
    });

    this.room.onMessage("give-hints", (client, data) => {
      this.state.hints = data; //data is hint given by host
      let hints = data;
      this.room.broadcast("set-hints", {
        hints: this.state.hints,
        submit: true,
      });
      // console.log("Hints are", this.state.hints);
      this.state.hasGivenHints = true;
    });

    this.room.onMessage("set-player-score", (client, data) => {
      this.state.players[client.id].score += data;
      this.room.broadcast("set-player-score", {
        score: this.state.players[client.id].score,
        sessionId: client.sessionId,
      });
      // console.log(
      //   "Score of ",
      //   this.state.players[client.id].username,
      //   this.state.players[client.id].score
      // );
    });
    //set for each, min or max of the score of team players
    this.room.onMessage("set-team-score", (client, data) => {
      this.room.state.players.forEach((element) => {
        console.log(element.team);
        this.room.state.players.forEach((ele) => {
          if (element.team === ele.team) {
            // if(oddRoundNo)
            element.score = Math.min(element.score, ele.score);
            ele.score = Math.min(element.score, ele.score);
          }
        });
      });
    });
    this.room.onMessage("send-message", (client, data) => {
      console.log("Message ", data);
      // console.log("Sender ", this.state.players[client.id].score);
      this.state.messages.push(
        `${this.state.players[client.id].username} : ${data}`
      );
    });

    this.room.onMessage("kick", (client, playerId) => {
      if (client.id === this.state.host) {
        const player = this.room.clients.find(
          (clientItem) => clientItem.sessionId === playerId
        );
        player.leave(4000);
      }
    });
    this.room.onMessage("start", (client, data) => {
      if (client.id === this.state.host) {
        this.state.isGameStarted = data.value;
        console.log("forming teams");
        if (this.state.isGameStarted) teams = [];
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
        this.state.hasTeamsFormed = true;
        this.state.rushers = msg.rushers;
        this.state.clueGivers = msg.clueGivers;
        this.room.broadcast("form-clueGivers", {
          clueGivers: msg.clueGivers,
        });
        console.log("Rushers are", msg.rushers);
        console.log("clue givers are", msg.clueGivers);
      }
    });
    this.room.onMessage("join-team", (client, msg) => {
      console.log("Join team ", msg);
      this.state.players[client.id].team = "Team " + msg;
      if (teams[msg].length < this.room.state.rushersPerTeamLimit + 1) {
        teams[msg].push(this.state.players[client.id].username);
        this.room.broadcast("join-teams", {
          teams: teams,
          maxRusher: this.state.rushersPerTeamLimit,
        });
        client.send("joined-team", {
          teams: msg,
          client: client,
        });
      }
      if (teams[msg].length === this.room.state.rushersPerTeamLimit) {
        console.log("Team ", msg, " full");
        this.room.broadcast("cant-join-teams", {
          teams: teams,
          msg: msg,
        });
      }
      console.log(teams);
      let everyoneJoined = true;
      this.room.state.players.forEach((element) => {
        // console.log("Player....",element);
        if (
          element !== this.room.state.players[this.room.state.host] &&
          !element.team
        ) {
          everyoneJoined = false;
          console.log(element.username, "not joined a team");
          console.log("Host...", this.room.state.host, client.sessionId);
        }
      });
      if (everyoneJoined) {
        this.room.broadcast("everyone-joined-team", {
          msg: true,
        });
      }
    });

    this.room.onMessage("host-chosen-color", (client, color) => {
      this.state.color = color;
      this.room.broadcast("set-host-chosen-color", {
        color,
      });
      console.log(color);
    });
    this.room.onMessage("rusher-guessed", (client, guesser) => {
      console.log(guesser);
      this.state.guessed.push("guesser", guesser);
      this.room.broadcast("set-rusher-guessed", {
        guesser,
      });
    });
    this.room.onMessage("game-end", (client) => {
      if (client.id === this.state.host) {
        console.log("Ending Game...");
        const winners = [];
        let winner = null;
        this.state.players.forEach((player, id) => {
          // console.log(player.balance, this.assetsValue(player.assets));
          const totalValue = player.score;
          if (!winner) {
            winner = { id, data: player, totalValue };
            return;
          }
          if (totalValue >= winner.totalValue) {
            winner.id = id;
            winner.data = player;
            winner.totalValue = totalValue;
          }
        });
        winners.push(winner);
        console.log(winner);
        this.room.broadcast("set-game-end", { winners });
        // this.room.disconnect();
      }
    });
    this.room.onMessage("play-again", (client) => {
      if (client.id === this.state.host) {
        this.state.hasGivenHints = false;
        while (this.state.hints.length !== 0) this.state.hints.pop();
        while (this.state.guessed.length !== 0) this.state.guessed.pop();
        // this.state.guessed = [];
        this.room.broadcast("set-play-again");
      }
    });
    this.room.onMessage("pause", () => {
      this.room.countdownInterval.pause();
    });
    this.room.onMessage("resume", () => {
      this.room.countdownInterval.resume();
    });
  }
};
