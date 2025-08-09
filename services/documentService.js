
const fs = require("fs");
const pdf = require ("pdf-parse");
const chunkText = require("./chunkText")
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()


async function parseAndStoreDocument(file, userId) {
  const buffer = fs.readFileSync(file.path);
  const data = await pdf(buffer);

  const cleanedText = data.text
    .replace(/\n\s*\n/g, "\n\n") 
    .replace(/\s+/g, " ");

  const chunks = chunkText(cleanedText, 1500);

  const docRecord = await prisma.document.create({
    data: {
      userId: userId,
      title: file.originalname,
      content: cleanedText, 
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

module.exports = parseAndStoreDocument