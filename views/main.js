const socket = io();

const inboxPeople = document.querySelector(".inbox__people");
const inputField = document.querySelector(".message_form__input");
const messageForm = document.querySelector(".message_form");
const messageBox = document.querySelector(".messages__history");
const fallback = document.querySelector(".fallback");
const addUserToConversationButton = document.getElementById("addUserToConversationButton");

//let userName = "";
socket.emit("new user");

socket.on('connect', async function () {
  async function getData(url) {
    const response = await fetch(url);
    return response.json();
  }
  
  const rooms = await getData('/conversations');
  console.log(rooms);

  rooms.forEach(function (room) {
    console.log(room);
    socket.emit('joinRoom', {
      room: room.id,
    }, function (data) {
      console.log(data);
    });
  });

});

const addToUsersBox = (userName) => {
  if (!!document.querySelector(`.${userName}-userlist`)) {
    return;
  }

  const userBox = `
    <div class="chat_ib ${userName}-userlist">
      <h5>${userName}</h5>
    </div>
  `;
  inboxPeople.innerHTML += userBox;
};

const addNewMessage = ({ user, message }) => {
  const time = new Date();
  const formattedTime = time.toLocaleString("en-US", { hour: "numeric", minute: "numeric" });

  const receivedMsg = `
  <div class="incoming__message">
    <div class="received__message">
      <p>${message}</p>
      <div class="message__info">
        <span class="message__author">${user}</span>
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  const myMsg = `
  <div class="outgoing__message">
    <div class="sent__message">
      <p>${message}</p>
      <div class="message__info">
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  messageBox.innerHTML += user === userName ? myMsg : receivedMsg;
};

addUserToConversationButton.addEventListener("click", addUserToConversation);

function addUserToConversation() {
  const addUserId = document.getElementById("addUserId");
  const conversationId = document.getElementById("conversationId");

  fetch(`/conversations/${conversationId.value}/adduser/${addUserId.value}`, {
    method: 'PUT',
  }).then((response) => {
    addUserId.value = '';
    conversationId.value = '';

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

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!inputField.value) {
    return;
  }

  // socket.emit("chat message", {
  //   message: inputField.value,
  //   nick: userName,
  // });

  console.log(inputField.value);

  const roomId = document.querySelector(".message_form__rooom");
  
  socket.emit('message', {
    text: inputField.value,
    room: roomId.value
  });

  roomId.value = "";
  inputField.value = "";
});

inputField.addEventListener("keyup", () => {
  socket.emit("typing", {
    isTyping: inputField.value.length > 0,
    nick: userName,
  });
});

socket.on("new user", function (data) {
  data.map((user) => addToUsersBox(user));
});

socket.on("user disconnected", function (userName) {
  document.querySelector(`.${userName}-userlist`).remove();
});

/*socket.on("chat message", function (data) {
  addNewMessage({ user: data.nick, message: data.message });
});*/

socket.on("message", function (data) {
  console.log(data);
  //addNewMessage({ user: data.nick, message: data.message });
});


// socket.on("typing", function (data) {
//   const { isTyping, nick } = data;

//   if (!isTyping) {
//     fallback.innerHTML = "";
//     return;
//   }

//   fallback.innerHTML = `<p>${nick} is typing...</p>`;
// });