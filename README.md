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


# PDF Locker (Next.js + Supabase)

Features:
- Google login via Supabase Auth
- Upload PDFs to a **private** Supabase Storage bucket
- List and download your previously uploaded PDFs

## Setup

1. **Create project**
   ```bash
   npx create-next-app@latest supa-pdfs --typescript --eslint
   cd supa-pdfs
