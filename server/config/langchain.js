const { CohereClient } = require("cohere-ai");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { Document } = require("@langchain/core/documents");

require('dotenv').config();

// Initialize Cohere client
const cohereClient = new CohereClient({
  token: process.env.COHERE_API_KEY
});

// Chat function using Cohere Command model (free)
const chat = async (prompt) => {
  const response = await cohereClient.chat({
    message: prompt,
    model: 'command-r7b-12-2024',
    temperature: 0
  });
  return response.text;
};

// text spliiter from langchain
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

const generateCohereEmbeddings = async (texts) => {
  const response = await cohereClient.embed({
    texts: texts,
    model: 'embed-english-light-v3.0',
    inputType: 'search_document'
  });
  return response.embeddings;
};


// Function to create document chunks
const createDocumentChunks = async (text) => {
    const chunks = await textSplitter.splitText(text);
    return chunks.map(chunk => new Document({ pageContent: chunk }));
  };

  // Function to generate embeddings for document chunks
const generateEmbeddings = async (documents) => {
    const texts = documents.map(doc => doc.pageContent);
    return await generateCohereEmbeddings(texts);
  };

  const findSimilarDocuments = async (query, documents, topK = 3) => {
    const response = await cohereClient.embed({
      texts: [query],
      model: 'embed-english-light-v3.0',
      inputType: 'search_query'
    });
    const queryEmbedding = response.embeddings[0];

    // Calculate cosine similarity between query and documents
    const similarities = documents.map((doc, index) => ({
      document: doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    // Sort by similarity score and return top K results
    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  };

  // Utility function to calculate cosine similarity
  const cosineSimilarity = (vecA, vecB) => {
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    return dotProduct / (normA * normB);
  };

module.exports = {
    chat,
    textSplitter,
    generateEmbeddings,
    findSimilarDocuments,
    createDocumentChunks
};