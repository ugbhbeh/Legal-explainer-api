require("dotenv").config();
const ModelClient = require("@azure-rest/ai-inference").default;
const { isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");
const  {PrismaClient} = require ("@prisma/client");
const prisma = new PrismaClient()
const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";

const client = ModelClient(endpoint, new AzureKeyCredential(token));

async function explainLegalText(textOrOptions, optionalTone) {
  let contentToExplain;
  let tone;

  // Handle both old and new calling styles
  if (typeof textOrOptions === 'string') {
    contentToExplain = textOrOptions;
    tone = optionalTone || 'simple';
  } else {
    const { text, documentId, tone: optionsTone = 'simple' } = textOrOptions;
    tone = optionsTone;
    
    if (documentId) {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { content: true },
      });
      if (!doc) throw new Error("Document not found");
      contentToExplain = doc.content;
    } else {
      contentToExplain = text;
    }
  }

  const prompt = `
You are an AI legal assistant. Explain the following legal content in ${tone} plain English.
Avoid legal jargon. Highlight anything risky or unusual if present.
Text:
${contentToExplain}
`;

  const response = await client.path("/chat/completions").post({
    body: {
      model,
      messages: [
        { role: "system", content: "" },
        { role: "user", content: prompt }
      ],
      temperature: 1,
      top_p: 1
    }
  });

  if (isUnexpected(response)) {
    throw response.body.error;
  }

  return response.body.choices[0].message.content;
}

module.exports = { explainLegalText };
