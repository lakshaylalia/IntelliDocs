
const { ChatSession } = require('../models/chat.model.js');
const { chat } = require('../config/langchain');
const { querySimilarChunks } = require('../config/mongodbVectorStore');

// Constants for memory management
const MAX_MESSAGES = 20; // Keep last 20 messages in full
const SUMMARY_TRIGGER = 25; // Summarize when messages exceed this

// Helper function to send SSE message
const sendSSE = (res, event, data) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

// Memory management: Summarize old messages and trim history
const manageChatMemory = async (session) => {
  const messageCount = session.messages.length;

  // If messages exceed threshold, summarize old ones
  if (messageCount > SUMMARY_TRIGGER) {
    try {
      // Get messages to summarize (all except last MAX_MESSAGES)
      const messagesToSummarize = session.messages.slice(0, messageCount - MAX_MESSAGES);

      if (messagesToSummarize.length > 0) {
        const conversationText = messagesToSummarize
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');

        // Ask LLM to summarize
        const summaryResponse = await chat(`Summarize this conversation concisely, keeping key points and important information:\n\n${conversationText}`);

        // Replace old messages with summary
        const summaryMessage = {
          role: 'assistant',
          content: `[Previous conversation summary]\n${summaryResponse}`,
          isSummary: true
        };

        // Keep recent messages and add summary
        session.messages = [
          summaryMessage,
          ...session.messages.slice(messageCount - MAX_MESSAGES)
        ];

        await session.save();
        console.log(`Chat memory managed: summarized ${messagesToSummarize.length} messages`);
      }
    } catch (error) {
      console.error('Error managing chat memory:', error);
      // Fallback: just trim messages
      session.messages = session.messages.slice(messageCount - MAX_MESSAGES);
    }
  }
};

const createSession = async (req, res) => {
  try {
    const session = new ChatSession({
      userId: req.user._id,
      title: req.body.title || 'New Chat'
    });

    await session.save();

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Error creating chat session' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    // Auto-generate title if this is the first message and title is default
    if (session.messages.length === 0 && session.title === 'New Chat') {
      try {
        const titleResponse = await chat(`Generate a short, descriptive title (max 50 characters) for this chat based on the user's first message: "${message}". Just return the title, nothing else.`);
        // Clean up the title - remove quotes if any
        let generatedTitle = titleResponse.trim();
        if (generatedTitle.startsWith('"') && generatedTitle.endsWith('"')) {
          generatedTitle = generatedTitle.slice(1, -1);
        }
        session.title = generatedTitle.substring(0, 50);
      } catch (titleError) {
        console.error('Error generating title:', titleError);
        // Fallback: use first few words of message
        session.title = message.substring(0, 47) + (message.length > 47 ? '...' : '');
      }
    }

    // Find relevant documents from user's vector store (user-isolated)
    const relevantDocs = await querySimilarChunks(message, req.user._id.toString());

    console.log("Query:", message);
    console.log("Relevant docs found:", relevantDocs.length);
    console.log("Doc scores:", relevantDocs.map(d => d.score));

    // Create context from relevant documents
    const context = relevantDocs
      .map(doc => doc.pageContent)
      .join('\n\n');

    console.log("Context length:", context.length);

      // console.log("context is :", context)
    // Prepare conversation history (exclude summaries to save tokens)
    const conversationHistory = session.messages
      .filter(msg => !msg.isSummary || msg.content.length < 500)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));


    const response = await chat(`You are a helpful AI assistant. Use the following context to answer the user's question: ${context}\n\nConversation:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${message}`);

    console.log("Response :", response)
    // Save messages to session
    session.messages.push(
      {
        role: 'user',
        content: message
      },
      {
        role: 'assistant',
        content: response.text || response,
        sourceDocs: relevantDocs.map(doc => ({
          documentId: doc.metadata.documentId,
          relevanceScore: doc.score
        }))
      }
    );

    await session.save();

    // Manage chat memory to prevent token limits
    await manageChatMemory(session);

    res.json({
      message: response.text || response,
      sources: relevantDocs.map(doc => ({
        documentId: doc.metadata.documentId,
        filename: doc.metadata.filename,
        relevanceScore: doc.score
      }))
    });
  } catch (error) {
    console.error('Chat error:', error.message, error.stack);
    res.status(500).json({ error: 'Error processing message: ' + error.message });
  }
};

// Streaming message handler (Server-Sent Events)
const streamMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user._id
    });

    if (!session) {
      sendSSE(res, 'error', { message: 'Chat session not found' });
      res.end();
      return;
    }

    // Auto-generate title if this is the first message and title is default
    if (session.messages.length === 0 && session.title === 'New Chat') {
      try {
        const titleResponse = await chat(`Generate a short, descriptive title (max 50 characters) for this chat based on the user's first message: "${message}". Just return the title, nothing else.`);
        // Clean up the title - remove quotes if any
        let generatedTitle = titleResponse.trim();
        if (generatedTitle.startsWith('"') && generatedTitle.endsWith('"')) {
          generatedTitle = generatedTitle.slice(1, -1);
        }
        session.title = generatedTitle.substring(0, 50);
      } catch (titleError) {
        console.error('Error generating title:', titleError);
        // Fallback: use first few words of message
        session.title = message.substring(0, 47) + (message.length > 47 ? '...' : '');
      }
    }

    // Send initial status
    sendSSE(res, 'status', { message: 'Searching documents...' });

    // Find relevant documents from user's vector store (user-isolated)
    const relevantDocs = await querySimilarChunks(message, req.user._id.toString());

    sendSSE(res, 'status', { message: 'Generating response...' });

    // Create context from relevant documents
    const context = relevantDocs
      .map(doc => doc.pageContent)
      .join('\n\n');

    // Prepare conversation history (exclude summaries to save tokens)
    const conversationHistory = session.messages
      .filter(msg => !msg.isSummary || msg.content.length < 500)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Stream the response (simulated with Cohere)
    const responseContent = await chat(`You are a helpful AI assistant. Use the following context to answer the user's question: ${context}\n\nConversation:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${message}`);

    // Send in chunks for SSE effect
    const words = responseContent.split(' ');
    for (const word of words) {
      sendSSE(res, 'message', { content: word + ' ' });
    }

    // Send sources
    sendSSE(res, 'sources', {
      sources: relevantDocs.map(doc => ({
        documentId: doc.metadata.documentId,
        filename: doc.metadata.filename,
        relevanceScore: doc.score
      }))
    });

    // Save messages to session
    session.messages.push(
      {
        role: 'user',
        content: message
      },
      {
        role: 'assistant',
        content: responseContent,
        sourceDocs: relevantDocs.map(doc => ({
          documentId: doc.metadata.documentId,
          relevanceScore: doc.score
        }))
      }
    );

    await session.save();

    // Save RAG evaluation data (async, don't wait)
    try {
      const RAGEvaluation = require('../models/ragEvaluation.model.js');
      const evaluation = new RAGEvaluation({
        userId: req.user._id,
        sessionId: session._id,
        query: message,
        response: responseContent,
        retrievedDocs: relevantDocs.map(doc => ({
          documentId: doc.metadata.documentId,
          filename: doc.metadata.filename,
          similarity: doc.score,
          content: doc.pageContent?.substring(0, 500)
        }))
      });
      evaluation.save().catch(err => console.error('Error saving RAG evaluation:', err));
    } catch (evalError) {
      console.error('Error creating RAG evaluation:', evalError);
    }

    // Manage chat memory to prevent token limits
    await manageChatMemory(session);

    // Send done signal
    sendSSE(res, 'done', { message: 'Response complete' });
    res.end();

  } catch (error) {
    console.error('Stream error:', error);
    sendSSE(res, 'error', { message: 'Error processing message' });
    res.end();
  }
};

const getHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user._id
    }).populate('messages.sourceDocs.documentId', 'filename');

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chat history' });
  }
};

// Delete a chat session
const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ChatSession.findOneAndDelete({ _id: sessionId, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    console.log("deleted")
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting chat session' });
  }
};

// Edit chat session title
const editSessionTitle = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    const session = await ChatSession.findOneAndUpdate(
      { _id: sessionId, userId: req.user._id },
      { title },
      { new: true }
    );
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Error updating chat session title' });
  }
};
// Get all chat sessions for a user
const getSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user._id })
      .select('_id title createdAt updatedAt')
      .sort({ updatedAt: -1 });
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chat sessions' });
  }
};

module.exports = {
  createSession,
  sendMessage,
  streamMessage,
  getHistory,
  getSessions,
  deleteSession,
  editSessionTitle
};