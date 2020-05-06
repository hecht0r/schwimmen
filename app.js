// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const port = process.env.PORT || 3001;
const io = require("./game_manager").listen(server);  // Start Socket.io server and let game_manager handle those connections

// Routing
app.use(express.static(path.join(__dirname, 'public')));

server.listen(port, function() {
	console.log('listening on localhost:' + port);
});