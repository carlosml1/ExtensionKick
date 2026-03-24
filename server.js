import express from "express";
import { WebSocketServer } from "ws";
import http from "http";

const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server });

let messages = [];

// 👉 MODS (en minúsculas SIEMPRE)
const mods = ["caaarlitos10"];

// función para comprobar mod
function isUserMod(username){
  if(!username) return false;
  return mods.includes(username.toLowerCase());
}

wss.on("connection", (ws) => {
  console.log("🟢 usuario conectado");

  // enviar historial
  ws.send(JSON.stringify({
    type: "history",
    messages
  }));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      console.log("📩 tipo:", data.type); // DEBUG

      // ================= MENSAJE =================
      if (data.type === "message") {

        const newMsg = {
          ...data,
          isMod: isUserMod(data.username)
        };

        messages.push(newMsg);

        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify(newMsg));
          }
        });
      }

      // ================= 🖼 IMAGEN =================
      if (data.type === "image") {

        // 🔒 limitar tamaño (~1MB)
        if (!data.image || data.image.length > 1_000_000) {
          console.log("❌ imagen demasiado grande");
          return;
        }

        const newMsg = {
          type: "image",
          id: data.id,
          username: data.username,
          image: data.image,
          isMod: isUserMod(data.username)
        };

        messages.push(newMsg);

        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify(newMsg));
          }
        });

        console.log("🖼 imagen enviada");
      }

      // ================= DELETE =================
      if (data.type === "delete") {

        if (!isUserMod(data.username)) return;

        const msg = messages.find(m => m.id === data.messageId);
        if (!msg) return;

        const targetIsMod = isUserMod(msg.username);

        // 🔥 MOD NO BORRA MOD
        if (targetIsMod) return;

        messages = messages.filter(m => m.id !== data.messageId);

        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: "delete",
              messageId: data.messageId
            }));
          }
        });

        console.log("🗑 mensaje eliminado");
      }

    } catch (e) {
      console.log("error:", e);
    }
  });

  ws.on("close", () => {
    console.log("🔴 usuario desconectado");
  });
});

// ruta base
app.get("/", (req, res) => {
  res.send("Servidor WebSocket activo 🚀");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});