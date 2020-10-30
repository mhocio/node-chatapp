const moment = require("moment");
const activeUsers = new Set();;

const socketModule = function (io, socket, users, conversations) {
	console.log("Made socket connection");

	async function getCurrentUser() {
		const userId = socket.request.session.passport.user;
		const thisUser = await users.findOne({
			id: userId
		});
		return thisUser;
	}

	socket.on("new user", async function (data) {
		const userId = socket.request.session.passport.user;
		const thisUser = await users.findOne({
			id: userId
		});

		socket.userId = thisUser.name;
		activeUsers.add(thisUser.name);
		console.log(activeUsers);

		io.emit("new user", [...activeUsers]);
	});

	socket.on("disconnect", async () => {
		activeUsers.delete(socket.userId);
		console.log("user disconnected");

		const user = await getCurrentUser();
		console.log(user);

		// TODO: store active users in the DB?
		user.conversations.forEach(function (room) {
			socket.broadcast.to(room.id).emit('message', {
				username: 'System',
				text: user.name + ' has left!',
				timestamp: moment().valueOf(),
				room: room,
				username: user.name,
				activeUsers: io.sockets.adapter.rooms[room.id],
			});
		});

		io.emit("user disconnected", socket.userId);
	});

	socket.on("chat message", function (data) {
		io.emit("chat message", data);
	});

	// socket.on("typing", function (data) {
	//   socket.broadcast.emit("typing", data);
	// });

	socket.on('message', async function (message) {
		message.timestamp = moment().valueOf();
		const conversation = await conversations.findOne({ id: message.room });
		if (!conversation) {
			return;
		}
		const user = await getCurrentUser();
		if (!conversation.participants.some(e => e.id === user.id)) {
			return;
		}

		console.log("sending message...");
		message.user = user.name;
		io.to(message.room).emit('message', message);
	});

	socket.on('joinRoom', async function (req, callback) {
		// TODO: check if can connect
		// i.e. check if user belongs to this conversation
		socket.join(req.room);
		const userId = socket.request.session.passport.user;
		const thisUser = await users.findOne({
			id: userId
		});

		console.log(socket.id);

		socket.broadcast.to(req.room).emit('message', {
			username: 'System',
			text: thisUser.name + ' has joined!',
			timestamp: moment().valueOf(),
			activeUsers: io.sockets.adapter.rooms[req.room],
			room: req.room,
		});

		console.log(`new user: ${thisUser.name} connectedo to room: ` + req.room);
	});
};

module.exports = {
	socketModule
};