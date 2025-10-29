const { v4: uuidv4 } = require('uuid');
const {
	checkAuthenticated,
	checkNotAuthenticated
} = require('../controllers/auth.js');
const { decrypt } = require('../controllers/crypto.js');

function Ex(status, message, name) {
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

	router.get('/:id', checkAuthenticated, async (req, res, next) => {
		try {
			const {
				id: conversationId,
			} = req.params;
			
			const conversation = await conversations.findOne({
				id: conversationId
			});
			if (!conversation) {
				throw new Ex(404, "no such conversation", "error");
			}
			const user = await users.findOne({
				id: req.session.passport.user
			});
			if (!conversation.participants.some(e => e.id === user.id)) {
				throw new Ex(403, "you are not in this conversation", "error");
			}

			if (conversation.messages)
				conversation.messages.forEach(elem => {
					if (elem.text && elem.text.iv) {
						elem.text = decrypt(elem.text);
					}
				});

			res.send(conversation);
		} catch (error) {
			next(error);
		}
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
				throw new Ex(401, "you are not the owner of this conversation", "denied");
			}
			if (conversation.participants.find(o => o.id === newParticipantId)) {
				throw new Ex(403, "user already added before", "denied");
			}

		// need to change to atomic operation - do updates and await them so we can log errors
		try {
			await conversations.update({ id: conversationId }, {
				$addToSet: {
					"participants": { id: newParticipantId }
				}
			});
		} catch (e) {
			console.error('Failed updating conversation participants:', e.message);
			throw e;
		}

		try {
			await users.update({ id: newParticipantId }, {
				$addToSet: {
					"conversations": { id: conversationId, name: conversation.name }
				}
			});
		} catch (e) {
			console.error('Failed updating new participant conversations:', e.message);
			throw e;
		}

		try {
			await users.update({ id: newParticipantId }, {
				$addToSet: {
					"newConversations": { id: conversationId, name: conversation.name }
				}
			});
		} catch (e) {
			console.error('Failed updating newConversations for user:', e.message);
			throw e;
		}

			res.json('sucess');
		} catch (error) {
			next(error);
		}
	});

	// router.get('/', checkAuthenticated, async (req, res) => {
	// 	const user = await users.findOne({
	// 		id: req.session.passport.user
	// 	});
	// 	res.send(user.conversations);
	// });

	router.get('/private/newconversations', checkAuthenticated, async (req, res) => {
		console.log("newconversations");
		const userId = req.session.passport.user;
		const thisUser = await users.findOne({
			id: userId
		});

		if (!thisUser.newConversations) {
			return res.sendStatus(204);
		}

		users.update({
			id: userId
		}, {
			$unset:	{newConversations:""}
		},
			false, true
		);

		res.send(thisUser.newConversations);
	});

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
			try {
				await users.update({ id: creatorId }, {
					$addToSet: {
						"conversations": { id: conversationId, name: newConversationName }
					}
				});
			} catch (e) {
				console.error('Failed to add conversation to creator:', e.message);
			}
		} else {
			console.log('creator not found when creating conversation');
		}

		console.log(createdConversation);
		res.send(createdConversation);
	});

	return router;
}