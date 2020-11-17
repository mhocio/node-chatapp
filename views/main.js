const socket = io();

const inboxPeople = document.querySelector(".inbox__people");
const inputField = document.querySelector(".message_form__input");
const messageBox = document.querySelector(".messages__history");
const fallback = document.querySelector(".fallback");

conversations = [];
messages = {};
activeConversation = {};

function createNewConversation() {
  const newConversationName = document.getElementById("newConversationName").value;
  console.log(newConversationName);
  fetch('/conversations/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept' : 'application/json',
      },
      body: JSON.stringify({ name: newConversationName })
    })
    .then((response) => {
      if (response.ok) {
        document.getElementById("newConversationName").value = '';
        refreshConversationsList();
        return response.json();
      } else {
        throw new Error(response.status);
      }
    })
    .then(data => {
    })
    .catch(error => {
      console.log(error);
    });
}

function appendMessageToMessagesDict(newMessageDiv, conversationId) {
  if (!messages[conversationId]) {
    messages[conversationId] = [newMessageDiv];
  } else {
    messages[conversationId].push(newMessageDiv);
  }
}

async function refreshConversationsList() {
  async function getData(url) {
    const response = await fetch(url);
    return response.json();
  }
  
  const rooms = await getData('/conversations');
  updateConversationsList(rooms);
}

socket.on('connect', async function () {
  async function getData(url) {
    const response = await fetch(url);
    return response.json();
  }
  const rooms = await getData('/conversations');
  updateConversationsList(rooms);

  if (rooms) {
    rooms.forEach(async function (room) {
      socket.emit('joinRoom', {
        room: room.id,
      }, function (data) {
        console.log(data);
      });
      const fetchedConversation = await getData('/conversations/' + room.id);
      if (fetchedConversation.messages) {
        fetchedConversation.messages.forEach(mess => {
          appendMessageToMessagesDict(createMessageDiv(mess.user, mess.text), room.id);
        });
      }
    });
  }
  
  console.log(conversations[0].id);
  setTimeout(function() { changeActiveConversation(conversations[0]); }, 1200);
});

function changeActiveConversation(conversation) {
  if (document.getElementById(activeConversation.id)) {
    document.getElementById(activeConversation.id).classList.remove("active-conversation");
  }
  if (document.getElementById(conversation.id)) {
    document.getElementById(conversation.id).classList.add("active-conversation");
  }

  activeConversation.id = conversation.id;
  activeConversation.name = conversation.name;
  if (activeConversation.name) {
    document.getElementById("active-conversation-text").innerHTML = activeConversation.name;
  } else {
    document.getElementById("active-conversation-text").innerHTML = activeConversation.id;
  }

  document.getElementById("messages").innerHTML = '';
  if (messages[conversation.id]) {
    messages[conversation.id].forEach(function (message) {
      document.getElementById("messages").appendChild(message);
    });
  }

  scrollSmoothToBottom('messages', 'false');
}

function updateConversationsList(rooms) {
  conversations = rooms;
  document.getElementById("conversations").innerHTML = '';
  if (conversations[0]) {
    changeActiveConversation(conversations[0]);
  }

  conversations.forEach(function (conversation) {
    //console.log(conversation);
    var newConversation = document.createElement('div');
    newConversation.setAttribute("id", conversation.id);
    newConversation.classList += "conversation";
    
    var link = document.createElement('a');
    link.setAttribute("id", conversation.id);
    if (conversation.name) {
      link.appendChild(document.createTextNode(conversation.name));
    } else {
      link.appendChild(document.createTextNode(conversation.id));
    }
    newConversation.addEventListener('click', function () {
      changeActiveConversation(conversation);
    });
    newConversation.appendChild(link);

    var dropdown = document.createElement("div");
    dropdown.classList += "dropdown";
    dropdown.setAttribute("style", "float: right;");

    var threeDotsButton = document.createElement("button");
    threeDotsButton.setAttribute("type", "button");
    threeDotsButton.setAttribute("style", "border-style: none !important; color: black;");
    threeDotsButton.setAttribute("data-toggle", "dropdown");
    threeDotsButton.setAttribute("aria-haspopup", "true");
    threeDotsButton.setAttribute("aria-expanded", "false");
    threeDotsButton.setAttribute("id", "conversationMenuDotsButton");
    threeDotsButton.classList += "btn btn-secondary btn-sm bg-transparent";
    threeDotsButton.innerHTML = "&#8942;";

    var dropdownMenu = document.createElement("div");
    dropdownMenu.setAttribute("aria-labelledby", "conversationMenuDotsButton");
    dropdownMenu.classList += "dropdown-menu";

    var addUserButton = document.createElement("button");
    addUserButton.setAttribute("data-toggle", "modal");
    addUserButton.setAttribute("data-target", "#exampleModal");
    addUserButton.setAttribute("data-conversation-id", `${conversation.id}`);
    if (conversation.name) {
      addUserButton.setAttribute("data-conversation-name", `${conversation.name}`);
    } else {
      addUserButton.setAttribute("data-conversation-name", `${conversation.id}`);
    }
    addUserButton.classList += "dropdown-item";
    addUserButton.innerHTML = "Add User";
    dropdownMenu.appendChild(addUserButton);

    dropdown.appendChild(threeDotsButton);
    dropdown.appendChild(dropdownMenu);
    newConversation.appendChild(dropdown);
    document.getElementById("conversations").appendChild(newConversation);
  });
}

document.getElementById("message-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const message = document.getElementById("input-group-field");
  if (!message.value) {
    return;
  }
  
  socket.emit('message', {
    text: message.value,
    room: activeConversation.id,
  });

  message.value = '';
});

function recieveMessage(room, message) {

}

function createMessageDiv(messageSender, messageText) {
  var newMessage = document.createElement('div');
  newMessage.classList.add("message");
  newMessage.appendChild(document.createTextNode('from:' + messageSender + ' message: ' + messageText));
  return newMessage;
}

socket.on("message", function (data) {
  console.log(data);
  const messageText = data.text;
  const messageSender = data.user;

  var newMessage = createMessageDiv(messageSender, messageText);

  console.log(activeConversation);

  if (activeConversation.id == data.room) {
    document.getElementById("messages").appendChild(newMessage);
    scrollSmoothToBottom('messages');
  }

  if (data.room) {
    var c = conversations.find(x => x.id === data.room);
    // console.log(c);
    if (!c) {
      return;
    }

    // if (!messages[c.id]) {
    //   messages[c.id] = [newMessage];
    // } else {
    //   messages[c.id].push(newMessage);
    // }
    appendMessageToMessagesDict(newMessage, c.id);
    console.log(messages);
  }
});

function scrollSmoothToBottom(id, smooth="t") {
  var div = document.getElementById(id);
  if (smooth=="false" || smooth=="f") {
    div.scrollTo({ top: div.scrollHeight});
  } else {
    div.scrollTo({ top: div.scrollHeight, behavior: 'smooth' });
  }
}

// inputField.addEventListener("keyup", () => {
//   socket.emit("typing", {
//     isTyping: inputField.value.length > 0,
//     nick: userName,
//   });
// });
// socket.on("typing", function (data) {
//   const { isTyping, nick } = data;

//   if (!isTyping) {
//     fallback.innerHTML = "";
//     return;
//   }

//   fallback.innerHTML = `<p>${nick} is typing...</p>`;
// });

function closeNav() {
  document.getElementById("column-left").style.width = "50";
}

function addUserToConversation(addUserId, conversationId) {
  fetch(`/conversations/${conversationId}/adduser/${addUserId}`, {
    method: 'PUT',
  }).then((response) => {
    console.log(response);
    // if (response.ok) {
    //     return response.json();
    // } else {
    //     throw new Error(response);
    // }
  }).then((data) => {
    console.log(data);
  }).catch (error => {
    console.log(error);
  });
}

$('#exampleModal').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget);
  // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
  var modal = $(this);
  modal.find('.modal-title').text('Add user to ' + button.data('conversation-name'));

  console.log(button.data('conversation-id'));

  document.getElementById("addNewUserToConversationForm").addEventListener("submit", (e) => {
    e.preventDefault();
    addUserToConversation(document.getElementById("username-to-add").value, button.data('conversation-id'));
  });
});