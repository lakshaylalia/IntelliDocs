const mongoose = require('mongoose');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { Document: LangchainDocument } = require('@langchain/core/documents');
require('dotenv').config();

// Initialize embeddings model
const embeddingsModel = new GoogleGenerativeAIEmbeddings({
  model: 'gemini-embedding-001',
  apiKey: process.env.GOOGLE_API_KEY,
});

// Collection name for vector store
const VECTOR_COLLECTION = 'vector_store';

// Track if we're using Atlas or local MongoDB
let isAtlasVectorSearch = false;

// Get the vector store collection
const getVectorCollection = () => {
  return mongoose.connection.db.collection(VECTOR_COLLECTION);
};

// Utility: Calculate cosine similarity
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
};

// Initialize vector store index (run once during setup)
const initializeVectorStore = async () => {
  try {
    const db = mongoose.connection.db;
    const collectionName = VECTOR_COLLECTION;

    // Create collection if it doesn't exist (for local MongoDB)
    try {
      const collections = await db.listCollections().toArray();
      const exists = collections.some(c => c.name === collectionName);

      if (!exists) {
        await db.createCollection(collectionName);
        console.log(`Created collection: ${collectionName}`);
      } else {
        console.log(`Collection ${collectionName} already exists`);
      }
    } catch (colError) {
      console.log('Collection check error:', colError.message);
    }

    const collection = getVectorCollection();
    const indexes = await collection.indexes();
    console.log(`=== DEBUG INFO ===`);
    console.log(`Database:`, db.databaseName);
    console.log(`Collection:`, collectionName);
    console.log(`All indexes:`, JSON.stringify(indexes, null, 2));
    console.log(`==================`);

    // Check for vector index (could be named differently in Atlas)
    let vectorIndex = indexes.find(idx => idx.name === 'vector_index');

    // Also check for any index with "vector" in the name
    if (!vectorIndex) {
      vectorIndex = indexes.find(idx =>
        idx.name?.toLowerCase().includes('vector') ||
        idx.key?.embedding === 'vector'
      );
    }

    // Try running a test $vectorSearch to see if Atlas index exists
    // Note: collection.indexes() doesn't show Atlas Search indexes, so we test directly
    try {
      const testEmbedding = new Array(768).fill(0.1);
      await collection.aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: testEmbedding,
            numCandidates: 10,
            limit: 1
          }
        }
      ]).toArray();
      console.log('✓ Atlas Vector Search is WORKING!');
      isAtlasVectorSearch = true;
      vectorIndex = {}; // Mark as found
    } catch (e) {
      console.log('✗ Atlas Vector Search error:', e.message);
      isAtlasVectorSearch = false;
    }

    if (!vectorIndex) {
      // Try to create vector index (only works on Atlas)
      try {
        await mongoose.connection.db.command({
          createIndexes: collectionName,
          indexes: [{
            name: 'vector_index',
            key: { embedding: 'vector' },
            vectorOptions: {
              type: 'knn',
              dimensions: 768,
              m: 2,
              efConstruction: 100,
              efSearch: 100
            }
          }]
        });
        isAtlasVectorSearch = true;
        console.log('Created vector index for MongoDB Atlas Vector Search');
      } catch (idxError) {
        // Vector index creation failed - likely local MongoDB
        console.log('Vector index not available (local MongoDB detected)');
        console.log('Will use manual cosine similarity for search');
        isAtlasVectorSearch = false;
      }
    } else {
      isAtlasVectorSearch = true;
      console.log('Vector index already exists');
    }

    return true;
  } catch (error) {
    console.log('Error initializing vector store:', error.message);
    return false;
  }
};

// Add document chunks to MongoDB vector store
const addDocumentChunks = async (chunks, userId) => {
  try {
    const collection = getVectorCollection();

    // First, generate embeddings for all chunks
    const documents = await Promise.all(chunks.map(async (chunk) => {
      const embedding = await embeddingsModel.embedQuery(chunk.content);
      return {
        content: chunk.content,
        embedding: embedding,
        metadata: {
          documentId: chunk.documentId.toString(),
          position: chunk.position,
          filename: chunk.filename,
          userId: userId
        }
      };
    }));

    // Insert all documents with their embeddings
    if (documents.length > 0) {
      await collection.insertMany(documents);
      console.log(`Added ${documents.length} chunks to vector store for user ${userId}`);
    }

    return true;
  } catch (error) {
    console.error('Error adding document chunks:', error.message);
    throw error;
  }
};

// Query similar chunks from MongoDB vector store (user-isolated)
const querySimilarChunks = async (query, userId, topK = 5) => {
  try {
    // Generate embedding for the query
    const queryEmbedding = await embeddingsModel.embedQuery(query);

    const collection = getVectorCollection();

    let results;

    if (isAtlasVectorSearch) {
      // Use $vectorSearch for MongoDB Atlas
      results = await collection.aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: topK * 2,
            limit: topK * 2,
            filter: {
              'metadata.userId': userId
            }
          }
        },
        {
          $project: {
            content: 1,
            metadata: 1,
            score: {
              $meta: 'vectorSearchScore'
            }
          }
        }
      ]).toArray();
    } else {
      // Fallback: Manual cosine similarity for local MongoDB
      const allDocs = await collection.find({
        'metadata.userId': userId
      }).toArray();

      // Calculate similarity scores
      const scoredDocs = allDocs.map(doc => ({
        ...doc,
        score: cosineSimilarity(queryEmbedding, doc.embedding)
      }));

      // Sort by score and take top K
      scoredDocs.sort((a, b) => b.score - a.score);
      results = scoredDocs.slice(0, topK);
    }

    return results.map(doc => ({
      pageContent: doc.content,
      score: doc.score,
      metadata: doc.metadata
    }));
  } catch (error) {
    console.error('Error querying similar chunks:', error.message);
    return [];
  }
};

// Delete all chunks for a document from vector store
const deleteDocumentChunks = async (documentId, userId) => {
  try {
    const collection = getVectorCollection();

    // Delete all chunks matching the documentId and userId
    const result = await collection.deleteMany({
      'metadata.documentId': documentId,
      'metadata.userId': userId
    });

    console.log(`Deleted ${result.deletedCount} chunks for document ${documentId}`);
    return true;
  } catch (error) {
    console.error('Error deleting document chunks:', error.message);
    return false;
  }
};

module.exports = {
  embeddingsModel,
  getVectorCollection,
  initializeVectorStore,
  addDocumentChunks,
  querySimilarChunks,
  deleteDocumentChunks
};