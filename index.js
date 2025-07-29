const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const UserRouter = require("./routes/UserRouter.js");
const ChatRouter = require("./routes/ChatRouter.js");

require("dotenv").config();

const app = express();
const httpServer = http.createServer(app); 

const prisma = new PrismaClient();
const port = 8080;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/users", UserRouter); 
app.use("/chats", ChatRouter);

httpServer.listen(port, () => {
  console.log(`Server launched on port ${port}`);
});