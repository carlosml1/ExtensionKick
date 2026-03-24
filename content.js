const WS_URL = "wss://extensionkick-production.up.railway.app";

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
chatBox.style.overflow = "hidden";

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

// 🔥 DRAG & DROP ZONA
messagesDiv.addEventListener("dragover", (e)=>{
  e.preventDefault();
  messagesDiv.style.background = "#222";
});

messagesDiv.addEventListener("dragleave", ()=>{
  messagesDiv.style.background = "";
});

messagesDiv.addEventListener("drop", (e)=>{
  e.preventDefault();
  messagesDiv.style.background = "";

  const file = e.dataTransfer.files?.[0];
  if(!file) return;

  // aceptar imágenes y gifs
  if(!file.type.startsWith("image/")){
    alert("❌ Solo imágenes o gifs");
    return;
  }

  if(!isConnected){
    alert("❌ No conectado al chat");
    return;
  }

  const reader = new FileReader();

  reader.onloadend = () => {
    const base64 = reader.result;

    if(!base64) {
      console.log("❌ error leyendo imagen");
      return;
    }

    console.log("📤 enviando imagen...");

    ws.send(JSON.stringify({
      type: "image",
      id: Date.now() + Math.random(),
      username,
      image: base64
    }));
  };

  reader.onerror = () => {
    console.log("❌ fallo leyendo archivo");
  };

  reader.readAsDataURL(file);
});

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

// ================= MENSAJES =================
function addMessage(msg){
  const div = document.createElement("div");
  div.dataset.id = msg.id;

  const icon = msg.isMod ? "🔨 " : "";

  // TEXTO
  if(msg.text){
    div.innerHTML = `${icon}<b>${msg.username}</b>: ${msg.text}`;
  }

  // 🖼 IMAGEN
  if(msg.image){
    div.innerHTML = `${icon}<b>${msg.username}</b>:<br>`;
    const img = document.createElement("img");
    img.src = msg.image;
    img.style.maxWidth = "100%";
    img.style.borderRadius = "6px";
    img.style.marginTop = "5px";
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

console.log("🔥 Chat online listo");
}

setTimeout(initChat,2000);