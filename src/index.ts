import express, { Request, Response } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import os from "os";
import dotenv from "dotenv";

import { handleSocket } from "./socket.js";

dotenv.config();

const PORT = parseInt(process.env.PORT || "3000", 10);

const interfaces = os.networkInterfaces();
const localIP =
  Object.values(interfaces)
    .flat()
    .find((i) => i?.family === "IPv4" && !i.internal)?.address || "localhost";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on("connection", (socket: Socket) => {
  console.log("Client connected:", socket.id);
  handleSocket(socket, io);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.get("/", (_: Request, res: Response) => {
  res.send("Server is running ✅");
});

server.listen(PORT, () => {
  console.log(`Server listening on http://${localIP}:${PORT}`);
});
