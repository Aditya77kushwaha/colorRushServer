const { Schema, ArraySchema, defineTypes } = require("@colyseus/schema");

class Player extends Schema {
  constructor() {
    super();
    this.score = 0;
    this.rgb = new ArraySchema();
  }
}
defineTypes(Player, {
  username: "string",
  team: "string",
  rgb: ["number"],
  score: "number",
});

module.exports = Player;
