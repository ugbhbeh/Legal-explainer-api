const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authenticateToken = require('../services/Auth');
const { explainLegalText } = require("../services/openai")
const ChatRouter = express.Router();
const prisma = new PrismaClient();

// send user input to gpt, save and return the response

ChatRouter.post("/", authenticateToken,  async (req, res) => {
    const userId = req.userId;
    const {input, tone } = req.body;

    if(!input || typeof input !== "string") {
        return res.status(400).json({error: "Input is not a string"})
    }

    try {
        const responseText = await explainLegalText(input, tone || "neutral");

        const conversation = await prisma.conversation.create({
            data: {
                userId, 
                input,
                response: responseText,
            }
        });

        res.json({conversation});
    } catch (error) {
        console.log("Azure GPT error", error);
        res.status(500).json({error:"Failed to generate response"})
    }

});

// fetch all chats of a logged in user

ChatRouter.get("/", authenticateToken, async (req, res) => {
  const userId = req.userId
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
    console.error(" ChatRouter/ error:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Fetch single chat by ID
ChatRouter.get("/:id", authenticateToken, async (req, res) => {
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
    console.error("ChatRouter/:id error:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

ChatRouter.delete("/:id", authenticateToken, async(req, res) => {
    const userId = req.userId;
    const {id} = req.params;

    try{
        const deleted = await prisma.conversation.deleteMany({
            where: {id, userId},
        });

        if(deleted.count === 0) {
            return res.status(404).json({error: "No conversation found"});   
        }
         res.json({success: true});
    } catch (error) {
        console.error("error deleting", error);
        res.status(500).json({error:"Failed to delete conversation"})
    }
});

module.exports = ChatRouter;