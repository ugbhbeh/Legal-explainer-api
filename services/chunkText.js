// Splits text into chunks of a specified max length, preserving word boundaries.
// Returns an array of strings, each no longer than maxLength (unless a single word is longer).

function chunkText(text, maxLength) {
  if (!text || typeof text !== 'string') return [];
  if (!maxLength || typeof maxLength !== 'number' || maxLength <= 0) return [text];

  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = '';

  for (const word of words) {
    // If adding the next word would exceed maxLength, push the current chunk and start a new one
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
