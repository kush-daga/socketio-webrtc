/** @format */
const chatForm = document.getElementById("chat-form");
const socket = io();
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

//Get username and room from url

const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true,
});

//Join chatroom
socket.emit("joinRoom", { username, room });

//Get rooms and users from
socket.on("roomUsers", ({ room, users }) => {
	outputRoomName(room);
	outputUsers(users);
});

//Message form server
socket.on("message", (message) => {
	console.log(message);
	outputMessage(message);

	//scroll down
	chatMessages.scrollTop = chatMessages.scrollHeight;
});

//Message submit

chatForm.addEventListener("submit", (e) => {
	e.preventDefault();

	const msg = e.target.elements.msg.value;
	//Emmiting message to server
	socket.emit("chatMessage", msg);

	//Clear inpout
	e.target.elements.msg.value = "";
	e.target.elements.msg.focus();
});

//Output message to dom
function outputMessage(message) {
	const div = document.createElement("div");
	div.classList.add("message");
	div.innerHTML = `
    <p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
       ${message.text}
    </p>
    `;
	document.querySelector(".chat-messages").appendChild(div);
}

//Add room name to dom
function outputRoomName(room) {
	roomName.innerText = `${room}`;
}

function outputUsers(users) {
	userList.innerHTML = `
	${users.map((user) => `<li>${user.username}</li>`.join(""))}
	`;
}
