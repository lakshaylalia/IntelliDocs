const Queue = require('bull');
const { Document, DocumentChunk } = require('../models/document.model.js');
const { createDocumentChunks } = require('../config/langchain');
const { addDocumentChunks, deleteDocumentChunks } = require('./mongodbVectorStore');
const fs = require('fs').promises;
const path = require('path');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');
const { DocxLoader } = require('@langchain/community/document_loaders/fs/docx');

// Try to import additional loaders
let UnstructuredLoader, CSVLoader, TextLoader;

try {
  const { UnstructuredLoader: UL } = require('@langchain/community/document_loaders/fs/unstructured');
  UnstructuredLoader = UL;
} catch (e) {
  console.log('UnstructuredLoader not available');
}

try {
  const { CSVLoader: CL } = require('@langchain/community/document_loaders/fs/csv');
  CSVLoader = CL;
} catch (e) {
  console.log('CSVLoader not available');
}

try {
  const { TextLoader: TL } = require('@langchain/community/document_loaders/fs/text');
  TextLoader = TL;
} catch (e) {
  console.log('TextLoader not available');
}

// Create the document processing queue
// Use REDIS_URL env var (required for Redis Cloud)
const redisUrl = process.env.REDIS_URL;

let documentQueue = null;
let redisClient = null;

// Only create queue if REDIS_URL is provided
if (redisUrl) {
  try {
    documentQueue = new Queue('document-processing', redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    documentQueue.on('error', (error) => {
      console.error('Redis Queue Error:', error.message);
    });

    console.log('Document processing queue initialized with Redis Cloud');
  } catch (error) {
    console.warn('Failed to create Redis queue:', error.message);
    documentQueue = null;
  }
} else {
  console.log('REDIS_URL not configured - will use synchronous processing');
}

// Process document job
const processDocument = async (job) => {
  const { documentId, filePath, originalname, userId } = job.data;

  // Resolve relative path to absolute path (for server portability)
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  console.log(`Processing document: ${originalname} (${documentId})`);
  console.log(`File path: ${resolvedPath}`);

  // Check if file exists
  try {
    await fs.access(resolvedPath);
  } catch (error) {
    throw new Error(`File not found: ${resolvedPath}. Make sure the upload and processing happen on the same server.`);
  }

  try {
    let fileContent;
    const fileExtension = path.extname(originalname).toLowerCase();

    // Parse file based on extension
    switch (fileExtension) {
      case '.pdf':
        const pdfLoader = new PDFLoader(resolvedPath);
        const pdfDocs = await pdfLoader.load();
        fileContent = pdfDocs.map(doc => doc.pageContent).join('\n\n');
        break;

      case '.docx':
        const docLoader = new DocxLoader(resolvedPath);
        const docDocs = await docLoader.load();
        fileContent = docDocs.map(doc => doc.pageContent).join('\n\n');
        break;

      case '.csv':
        if (CSVLoader) {
          const csvLoader = new CSVLoader(resolvedPath);
          const csvDocs = await csvLoader.load();
          fileContent = csvDocs.map(doc => doc.pageContent).join('\n\n');
        } else {
          // Fallback: read as text
          fileContent = await fs.readFile(resolvedPath, 'utf8');
        }
        break;

      case '.txt':
      case '.md':
      case '.json':
        // Plain text files
        fileContent = await fs.readFile(resolvedPath, 'utf8');
        break;

      case '.xlsx':
      case '.xls':
        // Excel files - extract sheet names and data
        try {
          const XLSX = require('xlsx');
          const workbook = XLSX.readFile(resolvedPath);
          const sheets = workbook.SheetNames;
          let excelContent = '';
          for (const sheetName of sheets) {
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            excelContent += `\n=== Sheet: ${sheetName} ===\n`;
            excelContent += data.map(row => row.join(', ')).join('\n');
          }
          fileContent = excelContent;
        } catch (xlsxError) {
          console.error('Error parsing Excel:', xlsxError.message);
          fileContent = `Excel file: ${originalname}\nNote: Could not parse content. Please convert to PDF for better results.`;
        }
        break;

      case '.pptx':
      case '.ppt':
        // PowerPoint files - basic text extraction
        try {
          const { readFile } = require('pptxtojson');
          const pptxJson = await readFile(resolvedPath);
          fileContent = pptxJson.map(slide =>
            slide.text || ''
          ).join('\n\n');
        } catch (pptError) {
          // Fallback: try reading as zip and extracting slides
          try {
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(resolvedPath);
            const slideEntries = zip.getEntries().filter(e => e.entryName.match(/slide\d+\.xml/));
            let pptContent = '';
            for (const entry of slideEntries) {
              const content = entry.getData().toString();
              // Extract text from XML
              const textMatches = content.match(/<a:t>([^<]+)<\/a:t>/g);
              if (textMatches) {
                pptContent += textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ') + '\n';
              }
            }
            fileContent = pptContent || `PowerPoint file: ${originalname}\nNote: Could not extract text.`;
          } catch (zipError) {
            fileContent = `PowerPoint file: ${originalname}\nNote: Could not parse content. Please convert to PDF for better results.`;
          }
        }
        break;

      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.gif':
      case '.bmp':
      case '.webp':
        // Image files - need OCR or vision model
        // For now, store a placeholder noting the limitation
        fileContent = `Image file: ${originalname}\nNote: Image content cannot be searched via chat. For searchable content, please convert to PDF or text format.`;
        break;

      default:
        // Try to read as plain text
        try {
          fileContent = await fs.readFile(resolvedPath, 'utf8');
        } catch (readError) {
          fileContent = `File: ${originalname}\nNote: This file format is not fully supported. Try converting to PDF or text format.`;
        }
    }

    // Update document with content
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    document.content = fileContent;
    document.status = 'processing';
    await document.save();

    // Create and store document chunks
    const chunks = await createDocumentChunks(fileContent);
    const documentChunks = chunks.map((chunk, index) => ({
      documentId: document._id,
      content: chunk.pageContent,
      position: index,
      filename: originalname
    }));

    // Save chunks to MongoDB
    await DocumentChunk.insertMany(documentChunks);

    // Store embeddings in MongoDB Atlas Vector Search
    await addDocumentChunks(documentChunks, userId);

    // Clean up uploaded file
    await fs.unlink(resolvedPath).catch(() => {});

    // Update document status to completed
    document.status = 'completed';
    document.processedAt = new Date();
    await document.save();

    console.log(`Document processed successfully: ${originalname}`);

    return {
      success: true,
      chunksCreated: documentChunks.length
    };

  } catch (error) {
    console.error('Error processing document:', error);

    // Update document status to failed
    const document = await Document.findById(documentId);
    if (document) {
      document.status = 'failed';
      document.error = error.message;
      await document.save();
    }

    // Clean up file
    await fs.unlink(resolvedPath).catch(() => {});

    throw error;
  }
};

// Start the queue worker (only if Redis is available)
let workerStarted = false;

const startWorker = async () => {
  if (!documentQueue) {
    console.log('No Redis queue available, skipping worker');
    return false;
  }

  if (workerStarted) {
    return true;
  }

  try {
    // Test Redis connection
    await documentQueue.isReady();

    // Process jobs
    documentQueue.process(async (job) => {
      return await processDocument(job);
    });

    workerStarted = true;
    console.log('Document processing worker started');
    return true;
  } catch (error) {
    console.warn('Could not start Redis worker:', error.message);
    return false;
  }
};

// Add document to processing queue
const addToQueue = async (documentId, filePath, originalname, userId) => {
  if (!documentQueue) {
    // Fallback: process synchronously
    console.log('Processing document synchronously (Redis not available)');
    await processDocument({
      data: { documentId, filePath, originalname, userId }
    });
    return { success: true, async: false };
  }

  try {
    const job = await documentQueue.add({
      documentId,
      filePath,
      originalname,
      userId
    }, {
      priority: 1,
      timeout: 300000 // 5 minutes max
    });

    console.log(`Document added to queue: ${job.id}`);
    return { success: true, async: true, jobId: job.id };
  } catch (error) {
    console.error('Error adding to queue:', error);
    // Fallback to synchronous processing
    console.log('Falling back to synchronous processing');
    await processDocument({
      data: { documentId, filePath, originalname, userId }
    });
    return { success: true, async: false };
  }
};

// Get job status
const getJobStatus = async (jobId) => {
  if (!documentQueue) {
    return null;
  }

  try {
    const job = await documentQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      state: await job.getState(),
      progress: job.progress(),
      data: job.data
    };
  } catch (error) {
    return null;
  }
};

// Get document processing status from DB
const getDocumentStatus = async (documentId) => {
  try {
    const document = await Document.findById(documentId).select('status processedAt error');
    return document;
  } catch (error) {
    return null;
  }
};

module.exports = {
  documentQueue,
  startWorker,
  addToQueue,
  getJobStatus,
  getDocumentStatus
};