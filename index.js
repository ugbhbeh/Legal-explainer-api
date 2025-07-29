const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const UserRouter = require("./routes/UserRouter.js");
const ChatRouter = require("./routes/ChatRouter.js");
const { Socket } = require("dgram");
const { error } = require("console");

require("dotenv").config();

const app = express();
const httpServer = http.createServer(app); 
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods:["GET", "POST"]
    }
});

const prisma = new PrismaClient();
const port = 8080;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/users", UserRouter); 
app.use("/chats", ChatRouter);

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Invalid token"));
});

httpServer.listen(port, () => {
  console.log(`Server launched on port ${port}`);
});