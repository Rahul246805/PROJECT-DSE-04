const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");

const normalizeOrigin = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  return value.trim().replace(/\/$/, "");
};

function initSocketServer(httpServer) {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL,
    process.env.PUBLIC_APP_URL,
    process.env.RENDER_EXTERNAL_URL,
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

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

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    console.log("User:", socket.user?.email);

    socket.on("ai-message", async (data) => {
      try {
        console.log("Incoming:", data);

        const { chat, content, model } = data;

        if (!content || !content.trim()) {
          return socket.emit("ai-response", {
            chat,
            content: "Message is required",
          });
        }

        socket.emit("ai-typing", { chat, status: true });

        const result = await aiService.generateResponse([
          { role: "user", content: String(content || "").trim() },
        ], { model });
        const reply = typeof result === "string" ? result : result?.reply;

        console.log("AI Reply:", reply);

        socket.emit("ai-typing", { chat, status: false });

        socket.emit("ai-response", {
          chat,
          content: reply,
          model: result?.model || model,
          usage: result?.usage || null,
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
