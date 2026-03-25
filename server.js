import express from "express";
import { WebSocketServer } from "ws";
import http from "http";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ================= DATA =================
let messages = [];
let bannedUsers = new Set();

const mods = ["caaarlitos10", "demetriusdementor", "l73ale", "fatinho", "jordantubb"];

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1486031073027686451/Np26uSuAfcFYEzPbiwMKxIoTuw99CqUaHlyK3NQNGjeAokqgrYtgwHdgb5Q48mEUmpFT";

// ================= UTILS =================
function normalize(name) {
  return name?.trim().toLowerCase();
}

function isUserMod(username) {
  return mods.includes(normalize(username));
}

async function sendToDiscord(content) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
  } catch {
    console.log("❌ error Discord");
  }
}

function broadcastUsers() {
  const users = [];

  wss.clients.forEach(client => {
    if (client.readyState === 1 && client.username) {
      users.push(client.username);
    }
  });

  const banned = Array.from(bannedUsers);

  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        type: "users",
        users,
        bannedUsers: banned
      }));
    }
  });
  console.log("👥 usuarios conectados:", users);
}

// ================= CONNECTION =================
wss.on("connection", (ws) => {
  console.log("🟢 usuario conectado");

  let currentUser = null;

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      // ================= REGISTER =================
      if (data.type === "register") {
        const username = normalize(data.username);

        if (bannedUsers.has(username)) {
          ws.send(JSON.stringify({ type: "banned" }));
          ws.close();
          return;
        }

        // 🔥 IMPORTANTE
        ws.username = username; // ← ESTA LÍNEA ES CLAVE

        currentUser = username;

        ws.send(JSON.stringify({
          type: "registered",
          username
        }));

        // 🔥 MUY IMPORTANTE (después de asignar username)
        broadcastUsers();

        ws.send(JSON.stringify({
          type: "history",
          messages
        }));

        return;
      }

      if (!currentUser) return;

      // ================= MESSAGE =================
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

        sendToDiscord(`💬 **${data.username}**: ${data.text}`);
      }

      // ================= IMAGE =================
      if (data.type === "image") {

        if (!data.image || data.image.length > 1_000_000) return;

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

        sendToDiscord(`🖼 **${data.username}** envió una imagen`);
      }

      // ================= DELETE =================
      if (data.type === "delete") {

        if (!isUserMod(data.username)) return;

        const msg = messages.find(m => m.id === data.messageId);
        if (!msg) return;

        if (isUserMod(msg.username)) return;

        messages = messages.filter(m => m.id !== data.messageId);

        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: "delete",
              messageId: data.messageId
            }));
          }
        });

        sendToDiscord(`🗑 **${data.username}** borró un mensaje`);
      }

      // ================= BAN =================
      if (data.type === "ban") {

        if (!isUserMod(data.username)) return;

        const target = normalize(data.target);

        if (isUserMod(target)) return;

        bannedUsers.add(target);

        wss.clients.forEach(client => {
          if (client.username === target) {
            client.send(JSON.stringify({ type: "banned" }));
            client.close();
          }
        });

        broadcastUsers();

        sendToDiscord(`🔨 **${data.username}** baneó a **${target}**`);
      }

      // ================= UNBAN =================
      if (data.type === "unban") {

        if (!isUserMod(data.username)) return;

        const target = normalize(data.target);

        bannedUsers.delete(target);

        broadcastUsers();

        sendToDiscord(`🔓 **${data.username}** desbaneó a **${target}**`);
      }

    } catch (e) {
      console.log("error:", e);
    }
  });

  ws.on("close", () => {
    if (currentUser) {
      broadcastUsers();
    }
    console.log("🔴 usuario desconectado");
  });
});

// ================= HTTP =================
app.get("/", (req, res) => {
  res.send("Servidor WebSocket activo 🚀");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});