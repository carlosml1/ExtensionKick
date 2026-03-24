import express from "express";
import { WebSocketServer } from "ws";
import http from "http";

const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server });

let messages = [];

// 👉 MODS
const mods = ["caaarlitos10", "demetriusdementor", "l73ale", "fatinho", "jordantubb"];

// ⚠️ PON TU WEBHOOK NUEVO AQUÍ
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1486031073027686451/Np26uSuAfcFYEzPbiwMKxIoTuw99CqUaHlyK3NQNGjeAokqgrYtgwHdgb5Q48mEUmpFT";

// comprobar mod
function isUserMod(username){
  if(!username) return false;
  return mods.includes(username.toLowerCase());
}

// 🔥 ENVIAR A DISCORD
async function sendToDiscord(content){
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
  } catch (err) {
    console.log("❌ error enviando a Discord");
  }
}

wss.on("connection", (ws) => {
  console.log("🟢 usuario conectado");

  // historial
  ws.send(JSON.stringify({
    type: "history",
    messages
  }));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      console.log("📩 tipo:", data.type);

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

        // 🔥 LOG DISCORD
        sendToDiscord(`💬 **${data.username}**: ${data.text}`);
      }

      // ================= IMAGEN =================
      if (data.type === "image") {

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

        // 🔥 LOG DISCORD
        sendToDiscord(`🖼 **${data.username}** envió una imagen`);
      }

      // ================= DELETE =================
      if (data.type === "delete") {

        if (!isUserMod(data.username)) return;

        const msg = messages.find(m => m.id === data.messageId);
        if (!msg) return;

        const targetIsMod = isUserMod(msg.username);

        // mod no borra mod
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

        // 🔥 LOG DISCORD
        sendToDiscord(`🗑 **${data.username}** borró un mensaje`);
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