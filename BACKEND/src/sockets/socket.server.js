const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173"],
      credentials: true,
    },
  });

  // AUTH
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers?.cookie || "";
      const cookies = cookie.parse(cookieHeader);
      const token = cookies.token;

      if (!token) {
        console.log("No token");
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id || decoded.userId;
      const user = await userModel.findById(userId).select("-password");

      if (!user) {
        console.log("User not found");
        return next(new Error("Unauthorized"));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.log("Auth error:", err.message);
      next(new Error("Unauthorized"));
    }
  });

  // CONNECTION
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    console.log("User:", socket.user?.email);

    socket.on("ai-message", async (data) => {
      try {
        console.log("Incoming:", data);

        const { chat, content } = data;

        if (!content || !content.trim()) {
          return socket.emit("ai-response", {
            chat,
            content: "Message is required",
          });
        }

        socket.emit("ai-typing", { chat, status: true });

        const reply = await aiService.generateResponse(content);

        console.log("AI Reply:", reply); // IMPORTANT

        socket.emit("ai-typing", { chat, status: false });

        socket.emit("ai-response", {
          chat,
          content: reply,
        });

      } catch (error) {
        console.error("AI ERROR:", error.message);

        socket.emit("ai-response", {
          chat: data?.chat,
          content: "AI service error",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = initSocketServer;
