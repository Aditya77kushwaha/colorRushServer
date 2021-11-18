const {
  Schema,
  MapSchema,
  ArraySchema,
  defineTypes,
} = require("@colyseus/schema");
const Player = require("./Player");
// class Teams extends Schema {}
// defineTypes(Teams, {
//   member: "string",
// });
class RegularRoomState extends Schema {
  constructor() {
    super();
    this.roundLimit = 2;
    this.timeLimit = 3;
    this.teamLimit = 2;
    this.rushersPerTeamLimit = 1;
    this.hasGivenHints = false;
    this.hasTeamsFormed = false;
    this.rgb = new ArraySchema();
    this.hints = new ArraySchema();
    this.messages = new ArraySchema();
    this.teams = new ArraySchema();
    this.players = new MapSchema();
  }
}

defineTypes(RegularRoomState, {
  players: { map: Player },
  isGameStarted: "boolean",
  hasTeamsFormed: "boolean",
  hasGivenHints: "boolean",
  timeLimit: "number",
  roundLimit: "number",
  teamLimit: "number",
  rushersPerTeamLimit: "number",
  host: "string",
  rgb: ["number"],
  hints: ["string"],
  messages: ["string"],
  teams: [["string"]],
});

module.exports = {
  RegularRoomState,
};
