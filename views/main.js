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
      joinConversation(data);
      //sortConversations();
      // socket.emit('joinRoom', {
      //   room: data.id,
      // }, function (data) {
      //   console.log(data);
      // });
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

async function getData(url) {
  const response = await fetch(url);
  return response.json();
}

async function refreshConversationsList() {
  const convs = await getData('/conversations');
  updateConversationsList(convs);
}

async function joinConversation(conversation) {
  console.log("joining...");
  socket.emit('joinRoom', {
    room: conversation.id,
  }, function (data) {
    //console.log(data);
  });
  const fetchedConversation = await getData('/conversations/' + conversation.id);
  var c = conversations.find(c => c.id === conversation.id);
  //console.log(c);
  if (fetchedConversation.messages) {
    fetchedConversation.messages.forEach(mess => {
      appendMessageToMessagesDict(createMessageDiv(mess), conversation.id);
    });
    //console.log(fetchedConversation.messages[fetchedConversation.messages.length - 1]);
    c.lastmessage = fetchedConversation.messages[fetchedConversation.messages.length - 1];
  } else {
    c.lastmessage = {"timestamp":0};
  }
  sortConversations();
}

socket.on('connect', async function () {
  const rooms = await getData('/conversations');
  updateConversationsList(rooms);

  if (rooms) {
    rooms.forEach(async function (room) {
      await joinConversation(room);
    });
  }
  console.log("sort connect");
  sortConversations();
  
  console.log(conversations[0].id);
  setTimeout(function() { changeActiveConversation(conversations[0]); sortConversations();}, 1200);
  //changeActiveConversation(conversations[0]);
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

function renderConversation(conversation) {
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
    return newConversation;
}

function sortConversations() {
  let ac = null;
  if (activeConversation) {
    ac = activeConversation;
  }

  console.log("inside SORTING");
  console.log(conversations);
  if (conversations[0] && conversations[0].lastmessage && conversations[0].lastmessage.timestamp) {
    console.log("sorting...!!!!!!!");
    conversations = conversations.sort(function(a, b) {
      return b.lastmessage.timestamp - a.lastmessage.timestamp;
    });
  }
  document.getElementById("conversations").innerHTML = '';
  conversations.forEach(function (conversation) {
    document.getElementById("conversations").appendChild(renderConversation(conversation));
  });

  if (ac) {
    changeActiveConversation(ac);
  }
}

function updateConversationsList(convs) {
  console.log(conversations);
  console.log(convs);

  // TODO: preserve lastmessage.timestamp
  convs.forEach(convToAdd => {
    if (!conversations.some(function(o){return o.id === convToAdd.id;})) {
      conversations.push(convToAdd);
    }
  });
  //conversations = convs;

  document.getElementById("conversations").innerHTML = '';
  if (conversations[0]) {
    changeActiveConversation(conversations[0]);
  }

  conversations.forEach(function (conversation) {
    document.getElementById("conversations").appendChild(renderConversation(conversation));
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

//function createMessageDiv(messageSender, messageText) {
  function createMessageDiv(message) {
  var newMessage = document.createElement('div');
  newMessage.classList.add("message");
  newMessage.appendChild(document.createTextNode('from:' + message.user + ' message: ' + message.text));
  return newMessage;
}

socket.on("message", function (data) {
  console.log(data);
  // const messageText = data.text;
  // const messageSender = data.user;
  var newMessage = createMessageDiv(data);

  console.log(activeConversation);

  if (activeConversation.id == data.room) {
    document.getElementById("messages").appendChild(newMessage);
    scrollSmoothToBottom('messages');
  }

  if (data.room) {
    var c = conversations.find(x => x.id === data.room);
    c.lastmessage = data;
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
    sortConversations();
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

$('#exampleModal').on('show.bs.modal', function (event) {
  event.stopPropagation();
  var button = $(event.relatedTarget);
  // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
  var modal = $(this);
  modal.find('.modal-title').text('Add user to ' + button.data('conversation-name'));

  console.log(button.data('conversation-id'));

  async function addUserToConversation(usernameToAdd, conversationId, conversationName) {
    console.log("adding...");
    fetch(`/conversations/${conversationId}/adduser/${usernameToAdd}`, {
      method: 'PUT',
    }).then((response) => {
      response.json().then(data => {
        if (response.ok) {
          modal.modal('hide');
          alert(`${usernameToAdd} successfully added to ${conversationName}.`);
        } else {
          throw new Error(data);
        }
      }).catch (error => {
        alert(`${error}`);
        console.log(error);
      });
    });
  };

  // https://stackoverflow.com/a/9251864/13753053
  var old_element = document.getElementById("addNewUserToConversationForm");
  var new_element = old_element.cloneNode(true);
  old_element.parentNode.replaceChild(new_element, old_element);

  document.getElementById("addNewUserToConversationForm").addEventListener("submit", (e) => {
    e.preventDefault();
    addUserToConversation(document.getElementById("username-to-add").value, button.data('conversation-id'), button.data('conversation-name'));
  });
});

async function subscribe() {
  let response = await fetch('/conversations/private/newconversations');

  if (response.status == 502) {
    await subscribe();
  } else if (response.status != 200) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    await subscribe();
  } else {
    var data = await response.json();
    console.log(data);
    refreshConversationsList();
    data.forEach(conv => {
      // socket.emit('joinRoom', {
      //   room: c.id,
      // });
      joinConversation(conv);
    });
    //sortConversations();
    await subscribe();
  }
}

subscribe();