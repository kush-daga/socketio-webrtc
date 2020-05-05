/** @format */
const path = require("path");
const express = require("express");
const http = require("http");
const formatMessage = require("./utils/messages.js");
const { userJoin, getCurrentUser, userLeavesChat, getRoomUsers } = require("./utils/users.js");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const bot = "CHAT BOT";
// Set static folder
app.use(express.static(path.join(__dirname, "public")));
//Run when client connects
io.on("connection", (socket) => {
	socket.on("joinRoom", ({ username, room }) => {
		const user = userJoin(socket.id, username, room);
		socket.join(user.room);
		socket.emit("message", formatMessage(bot, "Welcome to chat"));
		//Broadcast when a user connects.
		socket.broadcast
			.to(user.room)
			.emit("message", formatMessage(bot, `Welcome ${user.username} to the chat`));

		//Send users and room info
		io.to(user.room).emit("roomUsers", {
			room: user.room,
			users: getRoomUsers(user.room),
		});
	});

	//Listen for chat message
	socket.on("chatMessage", (msg) => {
		const user = getCurrentUser(socket.id);
		io.to(user.room).emit("message", formatMessage(user.username, msg));
	});
	//Runs when client disconnects
	socket.on("disconnect", () => {
		const user = userLeavesChat(socket.id);
		if (user) {
			io.to(user.room).emit("message", formatMessage(bot, `${user.username} left the chat`));
			//Send users and room info
			io.to(user.room).emit("roomUsers", {
				room: user.room,
				users: getRoomUsers(user.room),
			});
		}
	});

	socket.on("radio", function (blob) {
		const user = getCurrentUser(socket.id);
		// can choose to broadcast it to whoever you want
		console.log("Emmitting sound");
		socket.broadcast.to(user.room).emit("voice", blob);
	});
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => {
	console.log(`Server running on ${PORT}`);
});
