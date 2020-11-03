const moment = require("moment");
const { encrypt, decrypt } = require('./crypto');
const { v4: uuidv4 } = require('uuid');

const socketModule = function (io, socket, users, conversations) {
	console.log("Made socket connection");

	async function getCurrentUser() {
		const userId = socket.request.session.passport.user;
		const thisUser = await users.findOne({
			id: userId
		});
		return thisUser;
	}

	socket.on("disconnect", async () => {
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
		const timeOfMessage = moment().valueOf();
		message.timestamp = timeOfMessage;
		const conversationId = message.room;
		const conversation = await conversations.findOne({ id: conversationId });
		if (!conversation) {
			return;
		}
		const user = await getCurrentUser();
		if (!conversation.participants.some(e => e.id === user.id)) {
			return;
		}

		message.user = user.name;

		// TODO: append a message to the conversation
		conversations.update({
				id: conversationId
			}, {
				$addToSet: {
					"messages": {
						id: uuidv4(),
						timestamp: timeOfMessage,
						user: user.name,
						text: encrypt(message.text),
						room: conversationId
					}
				}
			},
			(err, result) => {}
		);

		console.log("sending message...");
		message.user = user.name;
		io.to(message.room).emit('message', message);
	});

	// TODO: add last read for each user's conversation
	// TODO: create GET:lastread in conversations to obtain the last message read by the user

	// TODO: add a socket info after being added to a new conversartion

	socket.on('joinRoom', async function (req, callback) {
		const user = await getCurrentUser();
		const conversation = await conversations.findOne({ id: req.room });
		if (!conversation.participants.some(e => e.id === user.id)) {
			return;
			// TODO: remove conversation from user's conversation (some error had happened)
		}

		socket.join(req.room);
		socket.broadcast.to(req.room).emit('message', {
			username: 'System',
			text: user.name + ' has joined!',
			timestamp: moment().valueOf(),
			activeUsers: io.sockets.adapter.rooms[req.room],
			room: req.room,
		});

		console.log(socket.id);
		console.log(`new user: ${user.name} connectedo to room: ` + req.room);
	});
};

module.exports = {
	socketModule
};