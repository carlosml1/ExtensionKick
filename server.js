import express from "express";
import { WebSocketServer } from "ws";
import http from "http";

const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server });

let messages = [];

// 👉 IDs de mods (pon aquí los tuyos)
const mods = ["g466bnrlt"];

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

      // ================= MENSAJE =================
      if (data.type === "message") {
        const newMsg = {
          ...data,
          isMod: mods.includes(data.userId)
        };

        messages.push(newMsg);

        // enviar a todos
        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify(newMsg));
          }
        });
      }

      // ================= DELETE =================
      if (data.type === "delete") {
        if (!mods.includes(data.userId)) return;

        messages = messages.filter(m => m.id !== data.messageId);

        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: "delete",
              messageId: data.messageId
            }));
          }
        });
      }

    } catch (e) {
      console.log("error:", e);
    }
  });

  ws.on("close", () => {
    console.log("🔴 usuario desconectado");
  });
});

// ruta básica (para evitar "Cannot GET /")
app.get("/", (req, res) => {
  res.send("Servidor WebSocket activo 🚀");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});