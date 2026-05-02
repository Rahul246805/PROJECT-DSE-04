// Load environment variables locally (NOT needed on Render)
if (!process.env.RENDER && process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { createServer } = require("http");
const express = require("express");

const connectDB = require("./src/configs/db");
const initSocketServer = require("./src/sockets/socket.server");
const app = require("./src/app");

// Create HTTP server
const httpServer = createServer(app);

// Use Render port or fallback
const PORT = process.env.PORT || 3000;

/* ================= DATABASE ================= */
connectDB();

/* ================= SOCKET ================= */
initSocketServer(httpServer);

/* ================= BASIC ROUTE (IMPORTANT FOR RENDER) ================= */
// This ensures Render detects an active server
app.get("/", (req, res) => {
  res.send("Mate.ai backend is running 🚀");
});

/* ================= START SERVER ================= */
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});