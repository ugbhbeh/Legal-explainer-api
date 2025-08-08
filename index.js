const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv')
dotenv.config();

const UserRouter = require("./routes/UserRouter.js");
const ChatRouter = require("./routes/ChatRouter.js");
//const DocumentRouter = require("./routes/DocumentRouter.js");
//const ExplanationRouter = require("./routes/ExplanationRouter.js");

const app = express();
const httpServer = http.createServer(app); 
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods:["GET", "POST"]
    }
});

app.get("/", async (req, res) => {
  const prisma = new PrismaClient();
const users = await prisma.user.findMany();
  res.json(users);
});

const port = 8080;


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/users", UserRouter); 
app.use("/chats", ChatRouter);
//app.use("/document", DocumentRouter);
//app.use("/explanations", ExplanationRouter);

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Invalid token"));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        return next(new Error("Authentication failed"));
    }
});

httpServer.listen(port, () => {
  console.log(`Server launched on port ${port}`);
});