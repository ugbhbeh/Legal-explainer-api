import multer from "multer";
import express from "express";
import { PrismaClient } from "@prisma/client";
import { explainLegalText } from "../services/explainLegalText"; // Adjust path if needed
const authenticateToken = require('../services/Auth');

const prisma = new PrismaClient();
const DocumentRouter = express.Router();

DocumentRouter.post("/", authenticateToken, async (req, res) => {
  try {
    const { documentId, question, tone } = req.body;
    const userId = req.user.id; 
    
    if (!documentId || !question) {
      return res.status(400).json({ error: "documentId and question are required" });
    }

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { chunks: true }
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const relevantText = doc.chunks
      .sort((a, b) => a.position - b.position)
      .map(chunk => chunk.text)
      .join("\n\n");

    const input = `
Question: ${question}
Document:
${relevantText}
    `;

    const explanation = await explainLegalText({ text: input, tone: tone || "neutral" });

    await prisma.explanation.create({
      data: {
        userId,
        documentId,
        summary: explanation,
        tone: tone || "neutral",
      }
    });
    return res.json({ answer: explanation });
  } catch (error) {
    console.error("Error in /document explain route:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default DocumentRouter;
