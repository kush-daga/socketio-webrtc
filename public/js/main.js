/** @format */
const chatForm = document.getElementById("chat-form");
const audioForm = document.getElementById("stream-audio");

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
socket.on("voice", function (arrayBuffer) {
	console.log("Recieving audio");
	var blob = new Blob([arrayBuffer], { type: "audio/ogg; codecs=opus" });
	var audio = document.createElement("audio");
	audio.src = window.URL.createObjectURL(blob);
	audio.play();
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
audioForm.addEventListener("submit", (e) => {
	e.preventDefault();
	sendAudio();
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
	${users.map((user) => `<li>${user.username}</li>`)}
	`;
}

function sendAudio() {
	var constraints = { audio: true };
	navigator.mediaDevices.getUserMedia(constraints).then((mediaStream) => {
		var mediaRecorder = new MediaRecorder(mediaStream);
		mediaRecorder.onstart = function (e) {
			this.chunks = [];
		};
		mediaRecorder.ondataavailable = function (e) {
			this.chunks.push(e.data);
		};
		mediaRecorder.onstop = function (e) {
			var blob = new Blob(this.chunks, { type: "audio/ogg; codecs=opus" });
			socket.emit("radio", blob);
		};
		//Start recording
		console.log("Starting recording");
		mediaRecorder.start();

		setInterval(function () {
			mediaRecorder.stop();
			mediaRecorder.start();
		}, 5000);
	});
}
