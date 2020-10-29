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
		console.log("new user");
		console.log(userId)

		socket.userId = thisUser.name;
		activeUsers.add(thisUser.name);
		console.log(activeUsers);

		io.emit("new user", [...activeUsers]);
	});

	socket.on("disconnect", () => {
		activeUsers.delete(socket.userId);
		console.log("user disconnected");
		io.emit("user disconnected", socket.userId);
	});

	socket.on("chat message", function (data) {
		io.emit("chat message", data);
	});

	// socket.on("typing", function (data) {
	//   socket.broadcast.emit("typing", data);
	// });

	socket.on('message', async function (message) {
		// TODO: check if can send messages to this room
		// i.e. check if user belongs to this conversation
		message.timestamp = moment().valueOf();
		const conversation = await conversations.findOne({ id: message.room });
		const user = await getCurrentUser();

		console.log(user);
		console.log(conversation.participants);

		/*var found = false;
		for(var i = 0; i < conversation.participants.length; i++) {
			if (conversation.participants[i].id == user.id) {
					found = true;
					break;
			}
		}
		console.log(found);

		if (conversation.participants.filter(e => e.id == user.id).length > 0) {
			console.log("user is not in this conversation or it does not exist");
			return;
		}*/

		console.log("sending...");
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
		socket.broadcast.to(req.room).emit('message', {
			username: 'System',
			text: thisUser.name + ' has joined!',
			timestamp: moment().valueOf()
		});

		console.log(`new user: ${thisUser.name} connectedo to room: ` + req.room);
	});
};

module.exports = {
	socketModule
};