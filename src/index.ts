import express from "express";
import http from "http";
import { Server } from "socket.io";
import os from "os";
import dotenv from "dotenv";

import { handleSocket } from "./socket"; // Import your socket handlers

dotenv.config();

const PORT = parseInt(process.env.PORT || "3000", 10);

// Optional: Log the local IP (useful for local testing)
const interfaces = os.networkInterfaces();
const localIP =
  Object.values(interfaces)
    .flat()
    .find((i) => i?.family === "IPv4" && !i.internal)?.address || "localhost";

// Express setup
const app = express();

// HTTP + WebSocket server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // ⚠️ Replace with frontend URL in production
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// WebSocket connection logic
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  handleSocket(socket, io); // Your custom logic
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Express base route
app.get("/", (_, res) => {
  res.send("Server is running 🟢");
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server listening on http://${localIP}:${PORT}`);
});
