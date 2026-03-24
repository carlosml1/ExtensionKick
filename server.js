import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();

// 🔥 ESTE ES EL CAMBIO CLAVE
const server = http.createServer(app);

const wss = new WebSocketServer({ 
  server,
  path: "/ws"   // 🔥 ESTO ES LA CLAVE
});

let messages = [];
const mods = ["g466bnrlt"]; // tu ID

wss.on("connection", (ws) => {
  console.log("🟢 cliente conectado");

  ws.send(JSON.stringify({
    type: "history",
    messages
  }));

  ws.on("message", (data) => {
    const msg = JSON.parse(data);

    if(msg.type === "message"){
      msg.isMod = mods.includes(msg.userId);
      messages.push(msg);

      wss.clients.forEach(client => {
        if(client.readyState === 1){
          client.send(JSON.stringify(msg));
        }
      });
    }

    if(msg.type === "delete"){
      if(mods.includes(msg.userId)){
        messages = messages.filter(m => m.id !== msg.messageId);

        wss.clients.forEach(client => {
          if(client.readyState === 1){
            client.send(JSON.stringify({
              type: "delete",
              messageId: msg.messageId
            }));
          }
        });
      }
    }
  });

  ws.on("close", () => {
    console.log("🔴 cliente desconectado");
  });
});

// 🔥 NECESARIO PARA RENDER
app.get("/", (req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 3000;

// 🔥 ESTO ES CLAVE (NO app.listen)
server.listen(PORT, () => {
  console.log("🚀 server activo en " + PORT);
});