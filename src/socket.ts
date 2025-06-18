import { Socket, Server } from "socket.io";

// Define a strongly-typed user structure
interface ConnectedUser {
  userId: string;
  publicKey: string;
  socketId: string;
}

// Define the message structure
interface EncryptedMessage {
  userId: string;
  to: string;
  data: string; // Encrypted message
  aesKey: string; // Encrypted AES key
  iv: string; // IV used for AES encryption
}

// Store connected users in memory
const users: ConnectedUser[] = [];

export const handleSocket = (socket: Socket, io: Server): void => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on("register_user", (data: Partial<ConnectedUser>) => {
    if (data?.userId && data?.publicKey) {
      const existingIndex = users.findIndex((u) => u.userId === data.userId);
      if (existingIndex !== -1) {
        users.splice(existingIndex, 1);
      }

      users.push({
        userId: data.userId,
        publicKey: data.publicKey,
        socketId: socket.id,
      });

      console.log(`✅ Registered user: ${data.userId}`);
      io.emit("user_list", users);
    } else {
      console.warn("❌ Invalid registration data");
      socket.emit("error", "Invalid registration data");
    }
  });

  socket.on("send_message", (data: EncryptedMessage) => {
    try {
      const { userId, to, data: messageData, aesKey, iv } = data;

      if (!userId || !to || !messageData || !aesKey || !iv) {
        throw new Error("Invalid message format");
      }

      const recipient = users.find((u) => u.userId === to);
      if (!recipient) {
        throw new Error("Recipient not found");
      }

      io.to(recipient.socketId).emit("receive_message", data);
      console.log(`📨 Message sent from ${userId} to ${to}`);
    } catch (error: any) {
      console.error("🚨 Message error:", error.message);
      socket.emit("error", "Failed to send message");
    }
  });

  socket.on("disconnect", () => {
    const userIndex = users.findIndex((u) => u.socketId === socket.id);
    if (userIndex !== -1) {
      const [removed] = users.splice(userIndex, 1);
      console.log(`❌ User disconnected: ${removed.userId}`);
      io.emit("user_list", users);
    } else {
      console.log(`❌ Unregistered socket disconnected: ${socket.id}`);
    }
  });

  socket.on("error", (err) => {
    console.error("🛑 Socket error:", err);
  });
};
