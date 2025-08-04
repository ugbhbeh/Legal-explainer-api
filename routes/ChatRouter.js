const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authenticateToken = require('../services/Auth');
const { explainLegalText } = require("../services/openai")
const ChatRouter = express.Router();
const prisma = new PrismaClient();

// send user input to gpt, save and return the response

ChatRouter.post("/", authenticateToken, async (req, res) => {
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