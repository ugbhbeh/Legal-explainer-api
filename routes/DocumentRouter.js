import multer from "multer";
import express from "express";
const DocumentRouter = express.Router();
const prisma = new PrismaClient();
import OpenAI from "openai";
const authenticateToken = require('../services/Auth');
import { parseAndStoreDocument } from "../services/documentService.js";

DocumentRouter.post("/", authenticateToken, async(req, res) => {
    const {documentId, question} = req.body;
    const doc = await prisma.document.findUnique({
        where: {id: documentId},
        include: {chunks: true}
    });
     const relevantText = doc.chunks
    .sort((a, b) => a.position - b.position)
    .map(c => c.text)
    .join("\n\n");

    const responseText = await explainLegalText(input, tone || "neutral");
    res.json({ answer: completion.choices[0].message.content });
})

export default DocumentRouter;