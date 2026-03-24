const WS_URL = "wss://extensionkick-production.up.railway.app";

function initChat(){

if(document.getElementById("mi-chat-overlay")) return;

// ================= USER =================
let userId = localStorage.getItem("userId");
if(!userId){
  userId = Math.random().toString(36).substring(2,10);
  localStorage.setItem("userId", userId);
}

let username = localStorage.getItem("username");

if(!username){
  username = prompt("Pon tu nombre:");
  localStorage.setItem("username", username);
}

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

// HEADER (drag)
const header = document.createElement("div");
header.innerText = "💬 Chat Online";
header.style.cursor = "move";
header.style.padding = "8px";
header.style.background = "#1a1a1f";

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

// ================= MENSAJES =================
function addMessage(msg){
  const div = document.createElement("div");
  div.dataset.id = msg.id;

  const icon = msg.isMod ? "🔨 " : "";

  div.innerHTML = `${icon}<b>${msg.username}</b>: ${msg.text}`;

  // 🔥 BOTÓN BORRAR (SOLO SI TÚ ERES MOD)
  const myIsMod = msg.isMod && msg.username.toLowerCase() === username.toLowerCase();

  if(myIsMod){
    const del = document.createElement("span");
    del.textContent = " 🗑";
    del.style.cursor = "pointer";

    del.onclick = ()=>{
      ws.send(JSON.stringify({
        type: "delete",
        messageId: msg.id,
        username // 🔥 IMPORTANTE (ya no usamos userId)
      }));
    };

    div.appendChild(del);
  }

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ================= SOCKET EVENTS =================
ws.onmessage = (event)=>{
  const data = JSON.parse(event.data);

  if(data.type === "history"){
    data.messages.forEach(addMessage);
  }

  if(data.type === "message"){
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

  if(text === "/id"){
    alert("Tu ID: " + userId);
    input.value = "";
    return;
  }

  const msg = {
    type: "message",
    id: Date.now() + Math.random(),
    username,
    text,
    userId
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