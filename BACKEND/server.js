if (!process.env.RENDER && process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { createServer } = require("http");

const connectDB = require("./src/configs/db");
const initSocketServer = require("./src/sockets/socket.server");
const app = require("./src/app");
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 3000;

// DB
connectDB();

// Socket
initSocketServer(httpServer);

// Start
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
