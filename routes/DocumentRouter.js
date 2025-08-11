const multer = require("multer");
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { explainLegalText } = require("../services/openai");
const parseAndStoreDocument = require("../services/documentService");
const authenticateToken = require("../services/Auth");


const prisma = new PrismaClient();
const DocumentRouter = express.Router();
const upload = multer({ dest: "uploads/" });

DocumentRouter.post("/upload", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (!req.userId) {     
      return res.status(400).json({ error: "No userId found" });
    }
    const doc = await parseAndStoreDocument(req.file, req.userId);
    console.log('Document created, id:', doc.id);
    res.json({ documentId: doc.id });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to process document" });
  }
});

DocumentRouter.post("/", authenticateToken, async (req, res) => {
  try {
    const { documentId, question, tone } = req.body;
    const userId = req.userId;
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
    console.log('Explanation created for document:', documentId);
    return res.json({ answer: explanation });
  } catch (error) {
    console.error("Error in /document explain route:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

module.exports = DocumentRouter;
