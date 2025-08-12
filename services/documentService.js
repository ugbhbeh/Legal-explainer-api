
const fs = require("fs");
const pdf = require ("pdf-parse");
const chunkText = require("./chunkText")
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()


async function parseAndStoreDocument(file, userId) {
  console.log('parseAndStoreDocument called');

  if (!file) {
    
    throw new Error('No file provided');
  }
  if (!userId) {
   
    throw new Error('No userId provided');
  }

  const buffer = fs.readFileSync(file.path);
  console.log('File read successfully, size:', buffer.length);

  console.log('Parsing PDF...');
  const data = await pdf(buffer);
  
  const cleanedText = data.text
    .replace(/\n\s*\n/g, "\n\n") 
    .replace(/\s+/g, " ");
  console.log('Cleaned text length:', cleanedText.length);

  console.log('Chunking text...');
  const chunks = chunkText(cleanedText, 1500);
  console.log('Number of chunks created:', chunks.length);

  console.log('Creating document in database with Prisma...');
  const docRecord = await prisma.document.create({
    data: {
      userId: userId,
      title: file.originalname,
      content: cleanedText, 
      chunks: {
        create: chunks.map((text, idx) => {
          console.log(`Creating chunk at position ${idx}, length: ${text.length}`);
          return {
            position: idx,
            text,
          };
        }),
      },
    },
    include: { chunks: true },
  });
  console.log('Document created in database:', docRecord.id);

  return docRecord;
}

module.exports = parseAndStoreDocument