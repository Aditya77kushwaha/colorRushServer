const Arena = require('@colyseus/arena').default;
const { monitor } = require('@colyseus/monitor');
// const basicAuth = require('express-basic-auth');

/**
 * Import your Room files
 */
const { MyRoom } = require('./rooms/MyRoom');

module.exports = Arena({
  getId: () => 'Your Colyseus App',

  initializeGameServer: (gameServer) => {
    /**
     * Define your room handlers:
     */
    gameServer.define('chat_room', MyRoom);
  },

  initializeExpress: (app) => {
    /**
     * Bind your custom express routes here:
     */

    app.get('/', (req, res) => {
      res.send("It's time to kick ass and chew bubblegum!");
    });

    // const basicAuthMiddleware = basicAuth({
    //   // list of users and passwords
    //   users: {
    //     adminUser: "adminPassword12345",
    //   },
    //   // sends WWW-Authenticate header, which will prompt the user to fill
    //   // credentials in
    //   challenge: true,
    // });
    app.use('/colyseus', monitor());
    /**
     * Bind @colyseus/monitor
     * It is recommended to protect this route with a password.
     * Read more: https://docs.colyseus.io/tools/monitor/
     */
    // app.use(
    //   "/colyseus",
    //   basicAuthMiddleware,
    //   monitor({
    //     columns: [
    //       "roomId",
    //       "name",
    //       "clients",
    //       { metadata: "spectators" }, // display 'spectators' from metadata
    //       "locked",
    //       "elapsedTime",
    //     ],
    //   })
    // );
  },

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called.
     */
  },
});
