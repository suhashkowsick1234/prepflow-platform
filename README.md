*#🚀 PrepFlow AI – AI-Powered Study Workspace #*
Flam Frontend Engineering Internship Submission

An AI-powered interactive learning platform that transforms any topic into a structured study workspace with summaries, flashcards, quizzes, interview preparation, coding examples, and revision notes.

🌐 Live Demo: https://prepflow-platform-prepflow.vercel.app

🎥 Demo Video: https://drive.google.com/file/d/1rPAu2SI2cJ6SdJy2bLnOZGnpOh36s5BA/view?usp=drivesdk

📖 Overview

PrepFlow AI is designed to make technical learning faster and more interactive.

Instead of generating an entire workspace in one expensive AI request, the application uses a modular, frontend-first architecture where each learning module is generated independently. This improves responsiveness, reduces API costs, and provides a smoother user experience.

✨ Features
📚 AI Study Workspace
AI-generated topic overview
Executive summary
Learning roadmap
Difficulty estimation
Key concepts
🧠 Flashcards
Interactive flashcards
Shuffle mode
Bookmark support
Progress tracking
Keyboard navigation
🎯 Quiz Module
Multiple-choice questions
Instant feedback
Score tracking
Retry incorrect answers
Performance analytics
💻 Coding Examples

Supports

C++
Java
Python
JavaScript

Includes

Brute Force
Better Approach
Optimal Solution
Time & Space Complexity
Syntax Highlighting
🎤 Interview Preparation
Technical Questions
Coding Questions
HR Questions
Scenario-based Questions
Model Answers
📖 Cheat Sheet
Quick revision notes
Important formulas
Common mistakes
Copy to clipboard
📊 Dashboard
Study history
Learning progress
Quiz performance
Saved topics
⚡ Engineering Highlights
Modular AI Generation

Each module is generated independently.

Overview
Flashcards
Quiz
Interview Questions
Coding Examples
Cheat Sheet

Benefits

Faster loading
Better fault tolerance
Easy retries
Lower API usage
IndexedDB Caching

Generated workspaces are cached locally.

Benefits

Faster repeat visits
Reduced API calls
Better user experience
Request Queue

Instead of sending multiple AI requests simultaneously, requests are processed sequentially.

Benefits

Prevents duplicate requests
Handles rate limits
Improves reliability
Secure Backend Proxy

The application uses an Express proxy to protect API keys.

Responsibilities

Secure API access
Model fallback
JSON validation
Error handling
🏗️ Architecture
                 React 19 + Vite
                         │
        ┌────────────────┴────────────────┐
        │                                 │
  IndexedDB Cache                 Request Queue
        │                                 │
        └──────────────┬──────────────────┘
                       │
                 Express API Proxy
                       │
                 AI Language Model
🛡️ Error Handling

The application handles

HTTP 429 rate limits
Invalid AI responses
Duplicate requests
Empty AI output
Topic switching
Offline caching
Request cancellation
🛠️ Tech Stack
Frontend
React 19
TypeScript
Vite
Tailwind CSS
Framer Motion
Prism.js
Backend
Node.js
Express.js
Groq API
Browser APIs
IndexedDB
AbortController
📁 Project Structure
prepflow-platform/

├── artifacts/
│   ├── prepflow/
│   └── api-server/
│
├── lib/
├── scripts/
├── package.json
├── pnpm-workspace.yaml
└── README.md
🚀 Getting Started
Clone Repository
git clone https://github.com/suhashkowsick1234/prepflow-platform.git
Install
pnpm install
Environment
GROQ_API_KEY=your_api_key
Run
node run-local.js

Visit

http://localhost:3000
📌 Key Technical Decisions
Modular AI generation instead of one large request.
IndexedDB caching for improved performance.
Request queue to avoid API rate limits.
Secure Express proxy for API key protection.
Responsive, component-based frontend architecture.
🎯 Why This Project?

PrepFlow AI demonstrates practical frontend engineering skills through:

Component-driven architecture
AI integration
State management
Performance optimisation
Responsive UI
Error handling
Caching strategies
Modern React development
📬 Contact

Suhash Kowsick Karri

GitHub: https://github.com/suhashkowsick1234
Live Demo: https://prepflow-platform-prepflow.vercel.app
Demo Video: https://drive.google.com/file/d/1rPAu2SI2cJ6SdJy2bLnOZGnpOh36s5BA/view?usp=drivesdk
