const WS_URL = "wss://extensionkick-production.up.railway.app";

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

  if(msg.image){
    div.innerHTML = `${icon}<b>${msg.username}</b>:<br>`;
    const img = document.createElement("img");
    img.src = msg.image;
    img.style.borderRadius = "6px";
    img.style.marginTop = "5px";

    img.onload = () => {
      if(img.naturalWidth > img.naturalHeight){
        img.style.width = "150px";
        img.style.height = "auto";
      } else {
        img.style.height = "150px";
        img.style.width = "auto";
      }
    };

    div.appendChild(img);
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

  if(data.type === "history"){
    data.messages.forEach(msg => {
      if(msg.username.toLowerCase() === username.toLowerCase()){
        isMyUserMod = msg.isMod === true;
      }
      addMessage(msg);
    });
  }

  if(data.type === "message" || data.type === "image"){
    if(data.username.toLowerCase() === username.toLowerCase()){
      isMyUserMod = data.isMod === true;
    }
    addMessage(data);
  }

  if(data.type === "delete"){
    const el = document.querySelector(`[data-id='${data.messageId}']`);
    if(el) el.remove();
  }
};

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