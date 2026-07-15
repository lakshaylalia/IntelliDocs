const express = require('express');
const cors = require('cors'); // Import cors
const rateLimit = require('express-rate-limit');
const authRouter = require('./routes/auth.route.js');
require('dotenv').config();
const documentRouter = require('./routes/document.route.js');
const chatRouter = require('./routes/chat.route.js');
const analyticsRouter = require('./routes/analytics.route.js');
const evaluationRouter = require('./routes/evaluation.route.js');
const connectDB = require('./config/database');
const { initializeVectorStore } = require('./config/mongodbVectorStore');

const app = express();

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// More strict rate limiting for chat/AI endpoints
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 chat requests per minute
  message: { error: 'Too many chat requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for document uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 uploads per minute
  message: { error: 'Too many uploads, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});


connectDB().then(() => {
  initializeVectorStore().then(() => {
    console.log('Vector store ready');
  }).catch(err => {
    console.log('Vector store initialization skipped:', err.message);
  });
});

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

app.use(express.json());

app.use('/api/v1/auth', generalLimiter, authRouter);
app.use('/api/v1/document', generalLimiter, uploadLimiter, documentRouter);
app.use('/api/v1/chat', generalLimiter, chatLimiter, chatRouter);
app.use('/api/v1/analytics', generalLimiter, analyticsRouter);
app.use('/api/v1/evaluation', generalLimiter, evaluationRouter);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});