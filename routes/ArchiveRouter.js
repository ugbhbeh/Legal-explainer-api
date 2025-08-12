const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authenticateToken = require('../services/Auth');
const ArchiveRouter = express.Router();
const prisma = new PrismaClient();

// get documents of a user


// fetch all chats of a logged in user

ArchiveRouter.get("/chats", authenticateToken, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        input: true,
        response: true,
        createdAt: true
      }
    });

    res.json({ conversations });
  } catch (error) {
    console.error("ArchiveRouter /chats error:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Fetch single chat by ID
ArchiveRouter.get("/chats/:id", authenticateToken, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json({ conversation });
  } catch (error) {
    console.error("ArchiveRouter /chats/:id error:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});



// get documents + their connected explanations.








module.exports = ArchiveRouter;