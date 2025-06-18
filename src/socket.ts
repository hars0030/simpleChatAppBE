import { Socket, Server } from "socket.io";

const users: { userId: string; publicKey: string; socketId: string }[] = [];

export const handleSocket = (socket: Socket, io: Server) => {
  console.log("New client connected");

  socket.on("register_user", (data) => {
    if (data?.userId && data?.publicKey) {
      // Check if user already exists and update their public key and socket ID
      const existingUserIndex = users.findIndex(
        (u) => u.userId === data.userId
      );
      if (existingUserIndex !== -1) {
        users.splice(existingUserIndex, 1);
      }
      // Add or update user in the list
      users.push({
        userId: data.userId,
        publicKey: data.publicKey,
        socketId: socket.id,
      });

      console.log("Registered user:", data.userId);
      io.emit("user_list", users);
    }
  });

  socket.on("send_message", (data) => {
    try {
      if (
        !data ||
        !data.userId ||
        !data.data ||
        !data.to ||
        !data.aesKey ||
        !data.iv
      ) {
        throw new Error("Invalid message format");
      }

      // Find recipient's socket
      const recipient = users.find((u) => u.userId === data.to);
      if (!recipient) {
        throw new Error("Recipient not found");
      }

      // Send message only to the recipient
      io.to(recipient.socketId).emit("receive_message", data);
      console.log(`Message sent from ${data.userId} to ${data.to}`);
    } catch (error) {
      console.error("Error handling message:", error);
      socket.emit("error", "Failed to process message");
    }
  });

  socket.on("disconnect", () => {
    // Remove user from the list
    const userIndex = users.findIndex((u) => u.socketId === socket.id);
    if (userIndex !== -1) {
      const disconnectedUser = users[userIndex];
      users.splice(userIndex, 1);
      console.log("User disconnected:", disconnectedUser.userId);
      io.emit("user_list", users);
    }
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
};
