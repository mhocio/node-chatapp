const { v4: uuidv4 } = require('uuid');
const {
	checkAuthenticated,
	checkNotAuthenticated
} = require('../controllers/auth.js');
const { decrypt } = require('../controllers/crypto.js');

function Ex(status, name, message) {
  if (status < 0) {
    this.status = 500;
  } else {
    this.status = status;
  }
  this.name = name;
  this.message = message;
}

module.exports = function (users, conversations) {
	const router = require('express').Router();

	router.get('/', checkAuthenticated, async (req, res) => {
		const user = await users.findOne({
			id: req.session.passport.user
		});
		res.send(user.conversations);
	});

	router.get('/:id', checkAuthenticated, async (req, res) => {
		const {
			id: conversationId,
		} = req.params;
		
		const conversation = await conversations.findOne({
			id: conversationId
		});
		if (!conversation) {
			return;
		}
		const user = await users.findOne({
			id: req.session.passport.user
		});
		if (!conversation.participants.some(e => e.id === user.id)) {
			return;
		}

		if (conversation.messages)
			conversation.messages.forEach(elem => {
				if (elem.text && elem.text.iv) {
					elem.text = decrypt(elem.text);
				}
			});

		res.send(conversation);
	});

	router.put('/:conversation/adduser/:name', checkAuthenticated, async (req, res, next) => {
		try {
			const creatorId = req.session.passport.user;
			const {
				conversation: conversationId,
				name: newUserName
			} = req.params;
			const conversation = await conversations.findOne({
				id: conversationId
			});
			const newParticipant = await users.findOne({
				name: newUserName
			});
			if (!newParticipant) {
				throw new Ex(404, "no such user", "error");
			}
			const newParticipantId = newParticipant.id;
			//console.log(newParticipantId);

			if (!conversation) {
				throw new Ex(404, "no such conversation", "error");
			}
			if (creatorId != conversation.owner) {
				throw new Ex(403, "not your conversation", "denied");
			}

			// need to change to atomic operation
			conversations.update({
					id: conversationId
				}, {
					$addToSet: {
						"participants": {
							id: newParticipantId,
						}
					}
				},
				(err, result) => {}
			);
			users.update({
					id: newParticipantId
				}, {
					$addToSet: {
						"conversations": {
							id: conversationId,
							name: conversation.name
						}
					}
				},
				(err, result) => {}
			);

			res.json('sucess');
		} catch (error) {
			console.log(error);
			next(error);
		}
	})

	router.post('/', checkAuthenticated, async (req, res) => {
		console.log("creating new conversation");
		console.log(req);
		console.log(req.body);
		const {
			name: newConversationName,
		} = req.body;

		const creatorId = req.session.passport.user;
		const conversationId = uuidv4();
		var newConversation = {
			id: conversationId,
			participants: [{
				id: creatorId
			}],
			owner: creatorId,
			name: newConversationName
		}

		const createdConversation = await conversations.insert(newConversation);

		const creator = await users.findOne({
			id: creatorId
		});
		console.log(creator);
		if (creator) {
			users.update({
					id: creatorId
				}, {
					$addToSet: {
						"conversations": {
							id: conversationId,
							name: newConversationName,
						}
					}
				},
				(err, result) => {}
			);
		} else {
			console.log('add these to user?');
		}

		console.log(createdConversation);
		res.send(createdConversation);
	});

	return router;
}