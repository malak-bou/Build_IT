// pour visibility toggle private/public

const toggleOptions = document.querySelectorAll(".visibility-toggle .option");
const publicSection = document.querySelector(".public");
const privateSection = document.querySelector(".private");

toggleOptions.forEach(opt => {
  opt.addEventListener("click", () => {
    // Remove active class from all and add to clicked
    toggleOptions.forEach(o => o.classList.remove("active"));
    opt.classList.add("active");

    // Show/hide sections based on selection
    if (opt.dataset.visibility === "public") {
      publicSection.style.display = "block";
      privateSection.style.display = "none";
    } else {
      publicSection.style.display = "none";
      privateSection.style.display = "flex"; // keep flex for centered input
    }

    // Optional: update filter variable
    currentVisibility = opt.dataset.visibility;
    applyFilters && applyFilters(); // call if you already have this function
  });
});

// Initialize default view
if (document.querySelector(".visibility-toggle .option.active").dataset.visibility === "public") {
  publicSection.style.display = "block";
  privateSection.style.display = "none";
} else {
  publicSection.style.display = "none";
  privateSection.style.display = "flex";
}


// handl the form 
document.addEventListener("DOMContentLoaded", () => {
  const addRoomBtn = document.querySelector(".add-room-btn");
  const modal = document.getElementById("createRoomModal");
  const cancelBtn = document.getElementById("cancelModal");

  console.log(addRoomBtn, modal, cancelBtn); // debug, doit afficher les éléments

  addRoomBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });
});


// Handle form submit
createRoomForm.addEventListener("submit", async e => {
  e.preventDefault();

  const roomName = document.getElementById("roomName").value.trim();
  const roomType = document.getElementById("roomType").value;
  const roomStatus = document.getElementById("roomStatus").value; // public/private

  const token = localStorage.getItem("token"); // récupère le token du login

  try {
    const res = await fetch("http://localhost:3000/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        name: roomName,
        type: roomType,
        status: roomStatus
      })
    });

    const result = await res.json();

    if (res.ok) {
      alert("Room created successfully!");
      if (roomStatus === "private") {
        alert(`Share this room ID with a friend: ${result.roomId}`);
      }
      modal.style.display = "none";
      createRoomForm.reset();

      // Rafraîchir la liste des rooms
      loadRooms();
    } else {
      alert(result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Server error while creating room");
  }
});



const floatingProfile = document.getElementById("floatingProfile");
const profileAvatar = document.getElementById("profileAvatar");
const profileDropdown = document.getElementById("profileDropdown");
const logoutBtn = document.getElementById("logoutBtn");
const userNameEl = document.getElementById("userName");

// Example user
let user = JSON.parse(localStorage.getItem("user"));
if (!user) {
  user = { username: "Alice" };
  localStorage.setItem("user", JSON.stringify(user));
}

// Fill avatar and dropdown info
profileAvatar.textContent = user.username.charAt(0).toUpperCase();
userNameEl.textContent = user.username;

// Toggle dropdown
profileAvatar.addEventListener("click", () => {
  profileDropdown.classList.toggle("hidden");
});

// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "../index.html";
});

// Close dropdown if clicking outside
document.addEventListener("click", (e) => {
  if (!floatingProfile.contains(e.target)) {
    profileDropdown.classList.add("hidden");
  }
});




const homeView = document.getElementById("homeView");
const meetingView = document.getElementById("meetingView");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const micBtn = document.getElementById("micBtn");
const camBtn = document.getElementById("camBtn");
const leaveBtn = document.getElementById("leaveBtn");

let localStream;
let peerConnection;

let micEnabled = true;
let camEnabled = true;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

async function startCall(friendName) {
  homeView.classList.add("hidden");
  meetingView.classList.remove("hidden");

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  localVideo.srcObject = localStream;

  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  console.log("Call started with", friendName);
}

/* =====================
   MICROPHONE TOGGLE
===================== */
micBtn.addEventListener("click", () => {
  const audioTrack = localStream.getAudioTracks()[0];
  micEnabled = !micEnabled;
  audioTrack.enabled = micEnabled;

  micBtn.textContent = micEnabled ? "Mute" : "Unmute";
  micBtn.classList.toggle("active", !micEnabled);
});

/* =====================
   CAMERA TOGGLE
===================== */
camBtn.addEventListener("click", () => {
  const videoTrack = localStream.getVideoTracks()[0];
  camEnabled = !camEnabled;
  videoTrack.enabled = camEnabled;

  camBtn.textContent = camEnabled ? "Stop Video" : "Start Video";
  camBtn.classList.toggle("active", !camEnabled);
});

/* =====================
   LEAVE MEETING
===================== */
leaveBtn.addEventListener("click", () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  localVideo.srcObject = null;
  remoteVideo.srcObject = null;

  meetingView.classList.add("hidden");
  homeView.classList.remove("hidden");

  micEnabled = true;
  camEnabled = true;

  micBtn.textContent = "Mute";
  camBtn.textContent = "Stop Video";
  micBtn.classList.remove("active");
  camBtn.classList.remove("active");
});

/* =====================
   DRAG LOCAL VIDEO
===================== */
const localVid = document.getElementById('localVideo');

let isDragging = false;
let offsetX, offsetY;

localVid.addEventListener('mousedown', e => {
  isDragging = true;
  offsetX = e.clientX - localVid.getBoundingClientRect().left;
  offsetY = e.clientY - localVid.getBoundingClientRect().top;
  localVid.style.cursor = 'grabbing';
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  localVid.style.cursor = 'grab';
});

document.addEventListener('mousemove', e => {
  if (!isDragging) return;

  let x = e.clientX - offsetX;
  let y = e.clientY - offsetY;

  // Prevent going out of video area
  const rect = localVid.getBoundingClientRect();
  const parentRect = localVid.parentElement.getBoundingClientRect();
  x = Math.max(0, Math.min(x, parentRect.width - rect.width));
  y = Math.max(0, Math.min(y, parentRect.height - rect.height));

  localVid.style.left = x + 'px';
  localVid.style.top = y + 'px';
});

const roomsList = document.getElementById("roomsList");

async function loadRooms() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch("http://localhost:3000/rooms", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const rooms = await res.json();

    roomsList.innerHTML = ""; // vide la liste

    rooms.forEach(room => {
      const div = document.createElement("div");
      div.classList.add("friend-card");
      div.dataset.roomId = room.id;
      div.dataset.roomName = room.name.toLowerCase();
      div.dataset.roomType = room.type.toLowerCase(); 
      div.innerHTML = `
        <div class="top">
          <div class="avatar">${room.name[0].toUpperCase()}</div>
          <div class="info">
            <span class="name">${room.name}</span>
            <p class="subtitle">${room.type}</p>
          </div>
        </div>
        <div class="bottom">
          <span class="tag">${room.type}</span>
        </div>
      `;
      div.addEventListener("click", () => startCall(room.name));
      roomsList.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    alert("Error loading rooms");
  }
}

// Charge les rooms au démarrage
loadRooms();

joinRoomBtn.addEventListener("click", async () => {
  const roomId = document.getElementById("roomCodeInput").value.trim();
  if (!roomId) return alert("Enter a room ID");

  const token = localStorage.getItem("token");

  try {
    const res = await fetch("http://localhost:3000/join-room", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ roomId })
    });

    const result = await res.json();

    if (!res.ok) {
      return alert(result.message);
    }

    // ✅ stocke la room jointe
    localStorage.setItem("currentRoom", JSON.stringify(result.room));

    // ✅ démarre directement la room
    startCall(result.room.name);

  } catch (err) {
    console.error(err);
    alert("Server error while joining room");
  }
});


const filterButtons = document.querySelectorAll(".filter-chip");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // retire active de tous et ajoute au bouton cliqué
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const type = btn.dataset.type.toLowerCase();

    document.querySelectorAll(".friend-card").forEach(card => {
      if (type === "all" || card.dataset.roomType === type) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  });
});
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const activeFilter = document.querySelector(".filter-chip.active").dataset.type.toLowerCase();

  document.querySelectorAll(".friend-card").forEach(card => {
  
  const matchSearch = card.dataset.roomName.includes(query) || 
                        card.dataset.roomType.includes(query) || 
                        card.dataset.roomId.includes(query);

    const matchFilter = (activeFilter === "all" || card.dataset.roomType === activeFilter);

    card.style.display = (matchSearch && matchFilter) ? "flex" : "none";
  });
});

