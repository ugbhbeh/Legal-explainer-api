
function chunkText(text, maxLength) {
  if (!text || typeof text !== 'string') return [];
  if (!maxLength || typeof maxLength !== 'number' || maxLength <= 0) return [text];

  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = '';

  for (const word of words) {
   
    if ((currentChunk + ' ' + word).trim().length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + word;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

module.exports = chunkText;
