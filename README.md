# IntelliDocs

A powerful Knowledge Management Platform built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring RAG (Retrieval Augmented Generation) for AI-powered document chat.

![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/MongoDB-VectorSearch-purple)

## ✨ Features

### Core Features
- 📄 **Document Upload**: Support for PDF, DOCX, TXT, MD, CSV, XLSX, PPTX, PNG, JPG
- 🤖 **AI-Powered Chat**: Chat with your documents using Google Gemini
- 🔍 **Vector Search**: MongoDB Atlas Vector Search for semantic similarity
- 📊 **Streaming Responses**: Real-time AI response streaming
- 🔐 **User Isolation**: Each user's data is isolated in the vector store
- 💬 **Chat History**: Persistent chat sessions with memory management
- 📝 **Markdown Support**: AI responses rendered with markdown
- ⚡ **Rate Limiting**: Protection against API abuse

### Enhanced Features
- 🔎 **Document Search**: Search through your uploaded documents
- 🏷️ **Tags & Categories**: Organize documents with custom tags and categories
- 👥 **Document Sharing**: Share documents with other users
- 📱 **Mobile Responsive**: Works on desktop and mobile with hamburger menu
- 📤 **Export Chat as PDF**: Download chat conversations
- ⌨️ **Keyboard Shortcuts**: Fast navigation (/ to focus, Ctrl+Enter to send)
- 📈 **RAG Evaluation**: Track precision/recall metrics and user feedback

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Database**: MongoDB with Atlas Vector Search
- **AI Framework**: LangChain
- **LLM**: Google Gemini 3 Flash
- **Embeddings**: Google text-embedding-004
- **Authentication**: JWT
- **Queue**: Bull + Redis (async processing)

### Frontend
- **Framework**: React 19
- **State Management**: TanStack Query (caching)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **Routing**: React Router DOM 7

## Project Structure

```
frontend/src/
├── features/                    # Feature-based architecture
│   ├── auth/                    # Authentication
│   ├── chat/                    # Chat
│   ├── documents/               # Documents
│   └── analytics/              # Analytics
├── shared/                      # Shared utilities
├── pages/                       # UI only (no logic)
├── components/                  # Reusable components
└── config/                     # Configuration
```

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Google Gemini API Key

### Backend
```bash
cd backend
npm install
# Create .env with MONGO_URI, JWT_SECRET, GOOGLE_API_KEY, CORS_ORIGIN, REDIS_URL
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Features

### 📁 Document Management
- Upload PDF, DOCX, XLSX, PPTX, Images
- Tags and categories
- Document search
- Share with other users

### 💬 Chat System
- RAG chat with Google Gemini
- Streaming responses
- Source citations
- Export as PDF
- User feedback (👍👎)

### 👤 User Features
- Profile management
- Theme settings (Light/Dark/System)
- Analytics dashboard
- RAG evaluation metrics

### 📊 Analytics
- Usage statistics
- RAG evaluation metrics
- User feedback tracking

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Ctrl+Enter` | Send (alt) |
| `Escape` | Clear input |
| `/` | Focus input |

## Quick Start

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---