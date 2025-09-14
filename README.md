# PDF Locker (Next.js + Supabase)

Features:
- Google login via Supabase Auth
- Upload PDFs to a **private** Supabase Storage bucket
- List and download your previously uploaded PDFs

## Overall Purpose

The application is designed to take a PDF file from a user, process it using an AI, and generate a set of presentation slides based on the content. This is a powerful tool for quickly summarizing and creating professional-looking slide decks for educational or business purposes.

---

## How It Works (High-Level Flow)

### 1. User Interface
The frontend, built with React, provides a dashboard where a logged-in user can upload a PDF. They can also specify parameters, such as the desired number of slides.

### 2. Authentication
User authentication is handled via **Google Sign-In** using **Supabase**. This ensures that every user has a private and secure space to store their files and generated content.

### 3. File Processing
When a user uploads a PDF, the backend (a **Next.js serverless API**) receives the file. It then sends the PDF's content to the **Anthropic AI model (Claude)**.

### 4. AI Generation
The AI analyzes the text and structure of the PDF and generates new content formatted as slides. For example:

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
## Setup

1. **Create project**
   ```bash
   npx create-next-app@latest supa-pdfs --typescript --eslint
   cd supa-pdfs
