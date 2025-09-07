# PDF Q&A Assistant 🤖📄

A cutting-edge **RAG (Retrieval-Augmented Generation)** application built with Next.js 14 that enables users to upload PDF documents and engage in intelligent conversations with their content using advanced AI technologies.

## OUTPUT:

# Signup/login:
<img width="1061" height="741" alt="image" src="https://github.com/user-attachments/assets/c2002946-ac50-4cb8-8acf-b2822fa79ff0" />

# Upload File:
<img width="1902" height="865" alt="image" src="https://github.com/user-attachments/assets/4e866c62-3230-447a-a30f-7a7683743aed" />

# Multiple PDF query:
<img width="1589" height="867" alt="image" src="https://github.com/user-attachments/assets/ee73dc09-990c-4c1e-84de-a482f14d926c" />


# History of chat:
<img width="1895" height="861" alt="image" src="https://github.com/user-attachments/assets/667924b7-90dc-400c-8713-a9eb5ff65bb1" />

## DataBase file:
<img width="1899" height="811" alt="image" src="https://github.com/user-attachments/assets/44fcb616-b66a-4a93-8110-d4749ae76f78" />

<img width="1696" height="670" alt="image" src="https://github.com/user-attachments/assets/f65f3429-2098-4d18-a39f-e37ebd242008" />


## 🌟 Features Overview

- 🔐 **Secure Authentication** - MongoDB Atlas with JWT-based protection
- 📄 **Multi-PDF Management** - Upload, process, and manage multiple documents
- 🤖 **Advanced RAG Pipeline** - ChromaDB + HuggingFace + Groq integration
- 💬 **Intelligent Chat Interface** - Context-aware conversations
- 🌙 **Modern UI/UX** - Dark mode, responsive design with Tailwind CSS
- 📊 **Chat History Management** - Persistent conversation storage
- 📥 **Export Capabilities** - Download chat sessions as TXT/JSON
- ⚡ **Real-time Processing** - Live document processing status

## 🏗️ Architecture & RAG Pipeline

### System Architecture Diagram
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   External      │
│   (Next.js)     │◄──►│   (Next.js)      │◄──►│   Services      │
│                 │    │                  │    │                 │
│ • Auth Forms    │    │ • Protected      │    │ • MongoDB Atlas │
│ • File Upload   │    │   Routes         │    │ • ChromaDB      │
│ • Chat UI       │    │ • JWT Middleware │    │ • Groq API      │
│ • Chat History  │    │ • RAG Pipeline   │    │ • HuggingFace   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### RAG Pipeline Deep Dive

#### 1. **Document Ingestion Pipeline**
```
PDF Upload → Text Extraction → Chunking → Embedding → Vector Storage
     ↓             ↓              ↓           ↓            ↓
File Validation → pdf-parse → Text Splitter → HF Model → ChromaDB
```

**Detailed Process:**
1. **File Validation**: PDF format, 10MB size limit
2. **Text Extraction**: `pdf-parse` library extracts raw text
3. **Intelligent Chunking**: 
   - Chunk size: 1000 characters
   - Overlap: 100 characters (preserves context)
   - Sentence boundary awareness
4. **Embedding Generation**: HuggingFace `sentence-transformers/all-MiniLM-L6-v2`
5. **Vector Storage**: ChromaDB with metadata indexing

#### 2. **Query Processing Pipeline**
```
User Question → Embedding → Vector Search → Context Retrieval → LLM Generation
      ↓             ↓            ↓               ↓                    ↓
   Validation → HF Embedding → ChromaDB Query → Top-K Chunks → Groq Response
```

**Detailed Process:**
1. **Question Analysis**: Input validation and preprocessing
2. **Semantic Search**: Convert question to vector, find similar chunks
3. **Context Assembly**: Retrieve top 3-5 most relevant chunks per document
4. **Prompt Engineering**: Combine context + question + chat history
5. **LLM Generation**: Groq's `llama3-8b-8192` generates contextual response

#### 3. **Security & Authentication Flow**
```
Request → JWT Validation → User Authorization → Resource Access
    ↓           ↓                 ↓                    ↓
Browser → Cookie/Header → Database Lookup → Protected Action
```

## 🔒 Security Implementation

### Authentication System
- **JWT Tokens**: HTTP-only cookies for security
- **Password Hashing**: bcrypt with 12 salt rounds
- **Session Management**: 7-day token expiry with refresh
- **Route Protection**: Middleware validates every API call

### Data Isolation
- **User Segregation**: Users can only access their own documents
- **Document Ownership**: Every document linked to specific user
- **Chat Privacy**: Sessions isolated per user account

### Input Validation
- **File Type**: Only PDF files accepted
- **File Size**: 10MB maximum limit
- **Content Sanitization**: XSS protection on all inputs
- **API Rate Limiting**: Prevents abuse (ready for production)

## 📂 Project Structure

```
pdf-qa-app/
├── 📁 app/                          # Next.js App Router
│   ├── 📁 api/                      # Backend API Routes
│   │   ├── 📁 auth/                 # Authentication endpoints
│   │   │   ├── 📄 login/route.ts    # Login endpoint
│   │   │   ├── 📄 register/route.ts # Registration endpoint
│   │   │   ├── 📄 logout/route.ts   # Logout endpoint
│   │   │   └── 📄 me/route.ts       # Get current user
│   │   ├── 📁 documents/            # Document management
│   │   │   └── 📄 upload/route.ts   # PDF upload & processing
│   │   └── 📁 chat/                 # Chat functionality
│   │       ├── 📄 route.ts          # Chat Q&A endpoint
│   │       └── 📄 export/route.ts   # Export chat sessions
│   ├── 📄 globals.css               # Global styles & theme
│   ├── 📄 layout.tsx                # Root layout with providers
│   └── 📄 page.tsx                  # Main application page
│
├── 📁 components/                   # React Components
│   ├── 📁 auth/                     # Authentication UI
│   │   ├── 📄 LoginForm.tsx         # Login form component
│   │   ├── 📄 RegisterForm.tsx      # Registration form
│   │   └── 📄 AuthPage.tsx          # Auth page wrapper
│   ├── 📁 chat/                     # Chat Interface
│   │   ├── 📄 ChatInterface.tsx     # Main chat component
│   │   └── 📄 ChatHistory.tsx       # Chat session history
│   ├── 📁 documents/                # Document Management
│   │   ├── 📄 DocumentUpload.tsx    # Drag & drop upload
│   │   └── 📄 DocumentList.tsx      # Document selection list
│   ├── 📁 layout/                   # Layout Components
│   │   ├── 📄 Header.tsx            # App header with user menu
│   │   ├── 📄 Sidebar.tsx           # Collapsible sidebar
│   │   └── 📄 MainLayout.tsx        # Main app layout
│   └── 📁 ui/                       # Shadcn UI components
│
├── 📁 contexts/                     # React Context Providers
│   ├── 📄 AuthContext.tsx           # Authentication state
│   └── 📄 ThemeContext.tsx          # Dark/Light theme
│
├── 📁 hooks/                        # Custom React Hooks
│   └── 📄 useDocuments.ts           # Document management hook
│
├── 📁 lib/                          # Core Libraries & Services
│   ├── 📁 models/                   # MongoDB Models
│   │   ├── 📄 User.ts               # User schema
│   │   ├── 📄 Document.ts           # Document schema
│   │   └── 📄 ChatSession.ts        # Chat session schema
│   ├── 📁 services/                 # Business Logic Services
│   │   ├── 📄 vectorStore.ts        # ChromaDB operations
│   │   ├── 📄 pdfProcessor.ts       # PDF processing logic
│   │   └── 📄 groqService.ts        # Groq API integration
│   ├── 📄 auth.ts                   # Authentication utilities
│   ├── 📄 mongodb.ts                # Database connection
│   └── 📄 utils.ts                  # Helper functions
│
├── 📁 types/                        # TypeScript Definitions
│   └── 📄 global.d.ts               # Global type declarations
│
├── 📄 .env.local                    # Environment variables
├── 📄 tailwind.config.ts            # Tailwind CSS configuration
├── 📄 package.json                  # Dependencies & scripts
└── 📄 README.md                     # This file
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ 
- **MongoDB Atlas** account
- **Groq API** key (free tier available)
- **HuggingFace** account (optional, for better embeddings)

- 

### Step 1: Project Setup
```bash
# Create new Next.js project
npx create-next-app@latest pdf-qa-app --typescript --tailwind --eslint --app
cd pdf-qa-app
```

### Step 2: Install Dependencies
```bash
# Core dependencies
npm install mongoose bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken

# AI/ML and PDF processing
npm install pdf-parse chromadb @huggingface/inference groq-sdk

# UI and styling
npm install react-hot-toast lucide-react class-variance-authority clsx tailwind-merge

# Docker to run chromaDb:
docker run -d \
  -p 8000:8000 \
  -e CHROMA_SERVER_CORS_ALLOW_ORIGINS="*" \
  chromadb/chroma

# Setup Shadcn UI
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input textarea card dialog dropdown-menu avatar separator
```

### Step 3: Environment Configuration
Create `.env.local` in project root:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pdf-qa-app

# JWT Secret (use a strong, random string)
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters

# Groq API Configuration
GROQ_API_KEY=gsk_your-groq-api-key-here

# HuggingFace API (Optional - for better embeddings)
HUGGINGFACE_API_KEY=hf_your-huggingface-token-here

# Application URL
NEXTAUTH_URL=http://localhost:3000
```

### Step 4: Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Account**: [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create New Cluster**:
   - Choose "Free Shared" tier
   - Select cloud provider and region
   - Create cluster (takes 3-5 minutes)

3. **Database Access**:
   - Create database user with read/write permissions
   - Note down username and password

4. **Network Access**:
   - Add IP address (0.0.0.0/0 for development)
   - For production, add specific IPs

5. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` and `<dbname>` in your `.env.local`

### Step 5: API Keys Setup

#### Groq API Key:
1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up with GitHub/Google
3. Go to "API Keys" section
4. Create new API key
5. Copy and add to `.env.local`

#### HuggingFace Token (Optional):
1. Visit [https://huggingface.co](https://huggingface.co)
2. Create account → Settings → Access Tokens
3. Create "Read" token
4. Add to `.env.local`

### Step 6: Run the Application

```bash
# Start development server
npm run dev

# Application will be available at:
http://localhost:3000
```

## 🖥️ Application Screenshots

### 1. Authentication Screen
```
┌─────────────────────────────────────────────────────────────┐
│                    PDF Q&A Assistant                       │
│               Upload PDFs and ask questions using AI       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                Welcome Back                         │   │
│  │                                                     │   │
│  │  Email    [________________________]               │   │
│  │  Password [________________________]               │   │
│  │                                                     │   │
│  │           [     Sign In     ]                      │   │
│  │                                                     │   │
│  │         Don't have an account? Sign up             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Main Dashboard Interface
```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ PDF Q&A Assistant                                    🌙 👤 User Menu              │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│ ┌─────────────────┐ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📁 Navigation   │ │                    Chat Interface                       │ │
│ │                 │ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ [Upload] [Docs] │ │ │ Chat                          [TXT] [JSON] Export  │ │ │
│ │    [History]    │ │ ├─────────────────────────────────────────────────────┤ │ │
│ │                 │ │ │                                                     │ │ │
│ │ ┌─────────────┐ │ │ │  👤 User: "What is the main topic of document 1?" │ │ │
│ │ │📄 Upload PDFs│ │ │ │                                                     │ │ │
│ │ │             │ │ │ │  🤖 Assistant: "Based on the document content,    │ │ │
│ │ │ Drag & Drop │ │ │ │      the main topic discusses..."                  │ │ │
│ │ │    Here     │ │ │ │                                                     │ │ │
│ │ │             │ │ │ │                                                     │ │ │
│ │ └─────────────┘ │ │ ├─────────────────────────────────────────────────────┤ │ │
│ │                 │ │ │ Ask a question... [________________________] [Send] │ │ │
│ │ 2 documents     │ │ └─────────────────────────────────────────────────────┘ │ │
│ │ selected        │ └─────────────────────────────────────────────────────────┘ │
│ └─────────────────┘                                                           │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### 3. Document Management View
```
┌─────────────────────────────────────────────────────────┐
│                    Your Documents (3)                  │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📄 Technical_Report_2024.pdf            ✅ Ready  │ │
│ │    2.4 MB • 156 chunks • Jan 15        [Selected] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📄 Research_Paper_ML.pdf                ⏳ Processing│ │
│ │    1.8 MB • Processing... • Jan 14                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📄 Meeting_Notes.pdf                    ✅ Ready  │ │
│ │    756 KB • 89 chunks • Jan 13         [Selected] │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 4. Chat History Management
```
┌─────────────────────────────────────────────────────────┐
│            Chat History                [New Chat]       │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Technical Report Discussion                         │ │
│ │ 📅 Today • 📄 2 documents • 💬 8 messages         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Research Paper Analysis                             │ │
│ │ 📅 Yesterday • 📄 1 document • 💬 12 messages      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Meeting Notes Q&A                                   │ │
│ │ 📅 2 days ago • 📄 1 document • 💬 6 messages      │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🧪 Testing the Application

### 1. Authentication Flow
```bash
# Test user registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Test user login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Document Upload Test
1. Login to the application
2. Navigate to "Upload" tab
3. Drag and drop a PDF file
4. Watch processing status change from "Processing" to "Ready"

### 3. Chat Functionality Test
1. Select one or more "Ready" documents
2. Ask questions like:
   - "What is this document about?"
   - "Summarize the main points"
   - "What are the key findings?"

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### 1. **MongoDB Connection Error**
```
Error: MongooseError: The `uri` parameter to `openUri()` must be a string
```
**Solution:**
- Check `.env.local` file exists and has correct `MONGODB_URI`
- Verify MongoDB Atlas connection string format
- Ensure network access is configured (IP whitelist)

#### 2. **ChromaDB Connection Issues**
```
Error: Failed to connect to ChromaDB
```
**Solution:**
```bash
# Install ChromaDB properly
pip install chromadb
# Or use Docker
docker run -p 8000:8000 chromadb/chroma
```

#### 3. **Groq API Rate Limit**
```
Error: Rate limit exceeded
```
**Solution:**
- Check API usage in Groq console
- Implement request queuing for high usage
- Consider upgrading to paid plan

#### 4. **PDF Processing Fails**
```
Error: Could not parse PDF
```
**Solution:**
- Ensure PDF is not corrupted or password-protected
- Check file size is under 10MB limit
- Verify PDF contains extractable text (not just images)

#### 5. **HuggingFace Timeout**
```
Error: Request timeout for HuggingFace API
```
**Solution:**
- First API call may be slow (model loading)
- Increase timeout in `vectorStore.ts`
- Consider caching embeddings

### Development Tips

#### Hot Reload Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

#### Database Reset (Development)
```javascript
// In MongoDB Atlas or local MongoDB
db.users.deleteMany({})
db.documents.deleteMany({})
db.chatsessions.deleteMany({})
```

#### Debug Mode
Add to `.env.local`:
```env
NODE_ENV=development
DEBUG=true
```

## 🚀 Production Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# - MONGODB_URI
# - JWT_SECRET
# - GROQ_API_KEY
# - HUGGINGFACE_API_KEY
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Performance Optimizations
1. **Implement Redis** for session caching
2. **Add CDN** for static assets
3. **Enable compression** in production
4. **Implement rate limiting** with Redis
5. **Add monitoring** with tools like Sentry

## 📊 Performance Metrics

### Expected Performance
- **PDF Processing**: 2-10 seconds (depending on size)
- **Chat Response**: 1-3 seconds
- **Document Search**: <500ms
- **Page Load**: <2 seconds

### Scalability Considerations
- **ChromaDB**: Can handle millions of vectors
- **MongoDB**: Scales horizontally
- **Next.js**: Serverless functions scale automatically
- **Groq API**: High-throughput LLM inference

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for Next.js
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

---

## 🎯 Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] MongoDB Atlas cluster created
- [ ] Groq API key obtained
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Development server running
- [ ] Test PDF uploaded successfully
- [ ] Chat functionality working
- [ ] Export feature tested

## 📞 Support

For technical issues or questions:
1. Check this README thoroughly
2. Review error logs in browser console
3. Check Network tab for API failures
4. Verify environment variables are set correctly

---

**Built with ❤️ using Next.js, TypeScript, and modern AI technologies.**
