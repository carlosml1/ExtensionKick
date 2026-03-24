const WS_URL = "wss://extensionkick-production.up.railway.app";

// ================= USERS =================
let usersList = [];
let modPanelBox = null; // 🔥 referencia modal
let bannedList = []; // 🔥 NUEVO

// ================= 7TV =================
let emotes = [];

async function load7TVEmotes(){
  try {
    const res = await fetch("https://7tv.io/v3/emote-sets/01FCKRX4D0000FA9SJTT9E2MC3");
    const data = await res.json();

    emotes = data.emotes.map(e => ({
      name: e.name,
      url: `https://cdn.7tv.app/emote/${e.id}/2x.webp`
    }));

    console.log("✅ emotes cargados:", emotes.length);
  } catch(e){
    console.log("❌ error cargando 7tv");
  }
}

function initChat(){

if(document.getElementById("mi-chat-overlay")) return;

// ================= USER =================
let username = localStorage.getItem("username");

if(!username){
  username = prompt("Pon tu nombre:");
  localStorage.setItem("username", username);
}

let isMyUserMod = false;

// ================= SOCKET =================
const ws = new WebSocket(WS_URL);
let isConnected = false;

ws.onopen = () => {
  console.log("🟢 conectado al servidor");
  isConnected = true;

  // 🔥 REGISTER
  ws.send(JSON.stringify({
    type: "register",
    username
  }));
};

ws.onerror = (err) => {
  console.error("❌ error websocket:", err);
};

ws.onclose = () => {
  console.log("🔴 desconectado");
  isConnected = false;
};

// ================= UI =================
const chatBox = document.createElement("div");
chatBox.id = "mi-chat-overlay";

chatBox.style.position = "fixed";
chatBox.style.top = "100px";
chatBox.style.left = "100px";
chatBox.style.width = "300px";
chatBox.style.height = "400px";
chatBox.style.background = "#111";
chatBox.style.color = "white";
chatBox.style.zIndex = "999999";
chatBox.style.display = "flex";
chatBox.style.flexDirection = "column";
chatBox.style.border = "1px solid #333";
chatBox.style.borderRadius = "10px";
chatBox.style.resize = "both";
chatBox.style.overflow = "auto";
chatBox.style.minWidth = "250px";
chatBox.style.minHeight = "300px";
chatBox.style.maxWidth = "90vw";
chatBox.style.maxHeight = "90vh";

// HEADER
const header = document.createElement("div");
header.style.cursor = "move";
header.style.padding = "8px";
header.style.background = "#1a1a1f";
header.style.display = "flex";
header.style.justifyContent = "space-between";
header.style.alignItems = "center";

const title = document.createElement("span");
title.innerText = "💬 Chat Online";

// PERFIL
const profileBtn = document.createElement("span");
profileBtn.innerText = "👤";
profileBtn.style.cursor = "pointer";

profileBtn.onclick = () => {
  const lastChange = localStorage.getItem("username_last_change");
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  if(lastChange && now - parseInt(lastChange) < THIRTY_DAYS){
    const remaining = THIRTY_DAYS - (now - parseInt(lastChange));
    const daysLeft = Math.ceil(remaining / (24 * 60 * 60 * 1000));
    alert(`⏳ Puedes cambiar tu nombre en ${daysLeft} día(s)`);
    return;
  }

  const newName = prompt("Nuevo nombre:");
  if(!newName || !newName.trim()) return;

  username = newName.trim();
  localStorage.setItem("username", username);
  localStorage.setItem("username_last_change", now);

  alert("✅ Nombre actualizado a: " + username);
};

header.appendChild(title);
header.appendChild(profileBtn);

// 👑 BOTÓN ADMIN
if(username.toLowerCase() === "caaarlitos10"){
  const modBtn = document.createElement("span");
  modBtn.innerText = "🛠";
  modBtn.style.cursor = "pointer";

  modBtn.onclick = openModPanel;

  header.appendChild(modBtn);
}

// MENSAJES
const messagesDiv = document.createElement("div");
messagesDiv.style.flex = "1";
messagesDiv.style.overflowY = "auto";
messagesDiv.style.padding = "10px";

// INPUT
const input = document.createElement("input");
input.placeholder = "mensaje";
input.style.padding = "8px";
input.style.border = "none";
input.style.background = "#222";
input.style.color = "white";
input.style.outline = "none";

// BOTÓN
const btn = document.createElement("button");
btn.innerText = "Enviar";
btn.style.background = "#333";
btn.style.color = "white";
btn.style.border = "none";
btn.style.cursor = "pointer";
btn.style.padding = "8px";

// ================= EMOTE BOX =================
const emoteBox = document.createElement("div");

emoteBox.style.position = "absolute";
emoteBox.style.bottom = "60px";
emoteBox.style.left = "10px";
emoteBox.style.background = "#1a1a1f";
emoteBox.style.border = "1px solid #333";
emoteBox.style.borderRadius = "8px";
emoteBox.style.padding = "5px";
emoteBox.style.display = "none";
emoteBox.style.maxHeight = "150px";
emoteBox.style.overflowY = "auto";

chatBox.appendChild(emoteBox);

let selectedIndex = 0;
let filtered = [];

// ================= INPUT EVENT =================
input.addEventListener("input", () => {
  const text = input.value.split(" ").pop().toLowerCase();

  if(!text){
    emoteBox.style.display = "none";
    return;
  }

  filtered = emotes
    .filter(e => e.name.toLowerCase().startsWith(text))
    .slice(0, 20);

  if(filtered.length === 0){
    emoteBox.style.display = "none";
    return;
  }

  renderEmoteBox();
});

function renderEmoteBox(){
  emoteBox.innerHTML = "";

  filtered.forEach((e, i) => {
    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.padding = "4px";
    item.style.cursor = "pointer";

    if(i === selectedIndex){
      item.style.background = "#333";
    }

    const img = document.createElement("img");
    img.src = e.url;
    img.style.width = "24px";
    img.style.marginRight = "6px";

    const name = document.createElement("span");
    name.textContent = e.name;

    item.appendChild(img);
    item.appendChild(name);

    item.onclick = () => selectEmote(i);

    emoteBox.appendChild(item);
  });

  emoteBox.style.display = "block";
}

function selectEmote(index){
  const parts = input.value.split(" ");
  parts.pop();
  parts.push(filtered[index].name);

  input.value = parts.join(" ") + " ";
  emoteBox.style.display = "none";
}

input.addEventListener("keydown", (e) => {

  if(e.key === "Tab" && emoteBox.style.display === "block"){
    e.preventDefault();
    selectEmote(selectedIndex);
  }

  if(e.key === "ArrowDown"){
    selectedIndex = (selectedIndex + 1) % filtered.length;
    renderEmoteBox();
  }

  if(e.key === "ArrowUp"){
    selectedIndex = (selectedIndex - 1 + filtered.length) % filtered.length;
    renderEmoteBox();
  }

  if(e.key === "Backspace" && input.value.length <= 1){
    emoteBox.style.display = "none";
  }
});

// ================= MENSAJES =================
function addMessage(msg){
  const div = document.createElement("div");
  div.dataset.id = msg.id;

  const icon = msg.isMod ? "🔨 " : "";

  if(msg.text){
    let text = msg.text;

    emotes.forEach(e => {
      const regex = new RegExp(`\\b${e.name}\\b`, "g");
      text = text.replace(regex, `<img src="${e.url}" style="width:24px;vertical-align:middle;">`);
    });

    div.innerHTML = `${icon}<b>${msg.username}</b>: ${text}`;
  }

  const canDelete = isMyUserMod && !msg.isMod;

  if(canDelete){
    const del = document.createElement("span");
    del.textContent = " 🗑";
    del.style.cursor = "pointer";

    del.onclick = ()=>{
      ws.send(JSON.stringify({
        type: "delete",
        messageId: msg.id,
        username
      }));
    };

    div.appendChild(del);
  }

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ================= SOCKET =================
ws.onmessage = (event)=>{
  const data = JSON.parse(event.data);

  if(data.type === "username_taken"){
    alert("❌ Nombre en uso");
    localStorage.removeItem("username");
    location.reload();
  }

  if(data.type === "banned"){
    document.body.innerHTML = "<h1 style='color:red'>⛔ BANEADO</h1>";
  }

  if(data.type === "users"){
    usersList = data.users;
    bannedList = data.bannedUsers || []; // 🔥 NUEVO

    if(modPanelBox){
      renderUsers(modPanelBox);
    }
  }

  if(data.type === "history"){
    data.messages.forEach(msg => {
      if(msg.username.toLowerCase() === username.toLowerCase()){
        isMyUserMod = msg.isMod === true;
      }
      addMessage(msg);
    });
  }

  if(data.type === "message"){
    addMessage(data);
  }

  if(data.type === "delete"){
    const el = document.querySelector(`[data-id='${data.messageId}']`);
    if(el) el.remove();
  }
};

// ================= MOD PANEL =================
function openModPanel(){

  const modal = document.createElement("div");
  modal.style = `
    position:fixed;
    top:0;
    left:0;
    width:100vw;
    height:100vh;
    background:rgba(0,0,0,0.7);
    display:flex;
    justify-content:center;
    align-items:center;
    z-index:9999999;
  `;

  const box = document.createElement("div");
  box.style = `
    background:#111;
    padding:20px;
    border-radius:10px;
    min-width:250px;
    max-height:80vh;
    overflow:auto;
  `;

  modPanelBox = box;

  renderUsers(box);

  modal.appendChild(box);

  modal.onclick = (e) => {
    if(e.target === modal){
      modal.remove();
      modPanelBox = null;
    }
  };

  document.body.appendChild(modal);
}

// ================= RENDER USERS =================
function renderUsers(box){
  box.innerHTML = "<h3 style='margin-bottom:10px'>👥 Usuarios</h3>";

  // ACTIVOS
  usersList.forEach(user => {

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.marginBottom = "8px";

    const name = document.createElement("span");
    name.textContent = user;

    const btn = document.createElement("button");

    btn.textContent = "BAN";
    btn.style.background = "red";

    btn.onclick = () => {
      if(user.toLowerCase() === "caaarlitos10") return;

      ws.send(JSON.stringify({
        type: "ban",
        username,
        target: user
      }));

      row.remove();
    };

    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.cursor = "pointer";

    row.appendChild(name);
    row.appendChild(btn);
    box.appendChild(row);
  });

  // 🔥 BANEADOS
  if(bannedList.length > 0){

    const title = document.createElement("div");
    title.textContent = "🚫 Baneados";
    title.style.marginTop = "10px";
    title.style.opacity = "0.7";
    box.appendChild(title);

    bannedList.forEach(user => {

      if(usersList.includes(user)) return;

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.marginBottom = "8px";

      const name = document.createElement("span");
      name.textContent = user;

      const btn = document.createElement("button");
      btn.textContent = "UNBAN";
      btn.style.background = "green";
      btn.style.color = "white";

      btn.onclick = () => {
        ws.send(JSON.stringify({
          type: "unban",
          username,
          target: user
        }));

        row.remove();
      };

      row.appendChild(name);
      row.appendChild(btn);
      box.appendChild(row);
    });
  }

  if(usersList.length === 0 && bannedList.length === 0){
    const empty = document.createElement("div");
    empty.textContent = "No hay usuarios...";
    empty.style.opacity = "0.6";
    box.appendChild(empty);
  }
}

// ================= ENVIAR =================
function send(){
  const text = input.value.trim();
  if(!text) return;

  if(!isConnected){
    alert("❌ No conectado al chat");
    return;
  }

  const msg = {
    type: "message",
    id: Date.now() + Math.random(),
    username,
    text
  };

  ws.send(JSON.stringify(msg));
  input.value = "";
}

btn.onclick = send;

input.addEventListener("keydown", e=>{
  if(e.key==="Enter") send();
});

// ================= DRAG =================
let dragging = false, offsetX, offsetY;

header.onmousedown = (e)=>{
  dragging = true;
  offsetX = e.clientX - chatBox.offsetLeft;
  offsetY = e.clientY - chatBox.offsetTop;
};

document.onmousemove = (e)=>{
  if(!dragging) return;
  chatBox.style.left = (e.clientX - offsetX)+"px";
  chatBox.style.top = (e.clientY - offsetY)+"px";
};

document.onmouseup = ()=> dragging=false;

// ================= MONTAR =================
chatBox.appendChild(header);
chatBox.appendChild(messagesDiv);
chatBox.appendChild(input);
chatBox.appendChild(btn);

document.body.appendChild(chatBox);

// 🔥 cargar emotes
load7TVEmotes();

console.log("🔥 Chat online listo");
}

setTimeout(initChat,2000);