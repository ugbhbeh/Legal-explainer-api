// services/documentService.js
import fs from "fs";
import pdf from "pdf-parse";
import { prisma } from "../prismaClient.js";
import { chunkText } from "../utils/chunkText.js";

export async function parseAndStoreDocument(file) {
  const buffer = fs.readFileSync(file.path);
  const data = await pdf(buffer);

  const cleanedText = data.text
    .replace(/\n\s*\n/g, "\n\n") 
    .replace(/\s+/g, " ") 

  const chunks = chunkText(cleanedText, 1500);

  const docRecord = await prisma.document.create({
    data: {
      title: file.originalname,
      filePath: file.path,
      chunks: {
        create: chunks.map((text, idx) => ({
          position: idx,
          text,
        })),
      },
    },
    include: { chunks: true },
  });

  return docRecord;
}
