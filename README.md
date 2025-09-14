# 🎯 Dill: AI-Powered Presentation Generator

**Dill** is a full-stack web application that lets you quickly create professional presentations from PDF documents using **AI** 🤖. It combines a robust backend with an interactive, user-friendly frontend for a modern, data-driven experience 🚀.

---

## ✨ Key Features

- **🔒 Secure Authentication**  
  Log in safely using your Google account via Supabase Auth.

- **🧠 AI-Powered Slide Generation**  
  Analyze your PDFs and generate a specified number of slides using the Claude AI model via the Anthropic API.

- **🗄️ Private File Storage**  
  Uploaded files and generated slide data are securely stored in a private Supabase Storage bucket—accessible only to you.

- **📊 Intuitive Dashboard**  
  Manage your presentations easily with options to download or delete generated slides.

- **🎨 Customizable Output**  
  Specify the number of slides for a tailored presentation experience.

---

## 🛠️ Technology Stack

### Monorepo Structure
The project is organized as a monorepo containing:

- **Backend**: Next.js  
- **Frontend**: Vite + React

---

### Backend (Next.js)
- **⚡ Framework**: Next.js v14.2.5  
- **🗃️ Database & Authentication**: Supabase for DB, auth, and file storage  
- **🤖 AI Integration**: `@anthropic-ai/sdk` to communicate with Claude AI  
- **📄 File Handling**: API routes for PDF uploads and AI service communication  

### Frontend (Vite + React)
- **⚡ Framework**: Vite + React for fast development  
- **🖌️ UI Components**: shadcn/ui for accessible and customizable components  
- **🎨 Styling**: Tailwind CSS for responsive design  
- **🔗 Routing**: react-router-dom for smooth navigation  

---
## Overall Purpose

The application is designed to take a PDF file from a user, process it using an AI, and generate a set of presentation slides based on the content. This is a powerful tool for quickly summarizing and creating professional-looking slide decks for educational or business purposes.

## Setup

1. **Create project**
   ```bash
   npx create-next-app@latest supa-pdfs --typescript --eslint
   cd supa-pdfs
