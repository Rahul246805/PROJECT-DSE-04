require("dotenv").config();

const { createServer } = require("http");

const connectDB = require("./src/configs/db");
const initSocketServer = require("./src/sockets/socket.server");
const app = require("./src/app");
const httpServer = createServer(app);

// DB
connectDB();

// Socket
initSocketServer(httpServer);

// Start
httpServer.listen(3000, () => {
  console.log("Server running on port 3000");
});
