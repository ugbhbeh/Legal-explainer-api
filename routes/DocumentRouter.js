const multer = require("multer");
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { explainLegalText } = require("../services/openai");
const parseAndStoreDocument = require("../services/documentService");
const authenticateToken = require("../services/Auth");


const prisma = new PrismaClient();
const DocumentRouter = express.Router();
const upload = multer({ dest: "uploads/" });

// uploading a file

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

// view all uploaded documents 

DocumentRouter.get("/", authenticateToken, async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.json({ documents });
  } catch (error) {
    console.error("GET /documents error:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// view a single document with its attached explanation.

DocumentRouter.get("/:id/with-explanation", authenticateToken, async (req, res) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        explanations: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!doc) return res.status(404).json({ error: "Document not found" });

    res.json(doc);
  } catch (error) {
    console.error("GET /documents/:id/with-explanations error:", error);
    res.status(500).json({ error: "Failed to fetch document with explanations" });
  }
});

// explanation for an uploaded file 

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

// delete document 

DocumentRouter.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.userId;

    // Ensure the document belongs to the user
    const existingDoc = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!existingDoc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Delete chunks, explanations, and document in a single transaction
    await prisma.$transaction([
      prisma.documentChunk.deleteMany({
        where: { documentId },
      }),
      prisma.explanation.deleteMany({
        where: { documentId, userId },
      }),
      prisma.document.delete({
        where: { id: documentId },
      }),
    ]);

    res.json({ message: "Document, related chunks, and explanations deleted successfully" });
  } catch (error) {
    console.error("DELETE /documents/:id error:", error);
    res.status(500).json({ error: "Failed to delete document and related data" });
  }
});


module.exports = DocumentRouter;
