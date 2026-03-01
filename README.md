<p align="center">
  <img src="https://api.dicebear.com/7.x/shapes/svg?seed=candidateos&backgroundColor=7c3aed&size=80" alt="CandidateOS Logo" width="80" height="80" />
</p>

<h1 align="center">CandidateOS</h1>

<p align="center">
  <strong>AI-Powered Career Platform for Candidates & Recruiters</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-5-purple?logo=vite" />
  <img src="https://img.shields.io/badge/Supabase-Backend-green?logo=supabase" />
  <img src="https://img.shields.io/badge/Groq-AI-orange" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-cyan?logo=tailwindcss" />
</p>

---

## 🚀 Overview

**CandidateOS** is a full-stack career management platform that connects candidates and recruiters through an intelligent, AI-driven workflow. Candidates can apply for jobs, take AI-scored assessments, prepare for interviews with real-time AI feedback, and optimize their resumes — all from a single dashboard. Recruiters can post jobs, manage candidate pipelines, assign assessments, schedule interviews, and communicate with candidates.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🧠 **AI Copilot** | Contextual career assistant powered by Groq (Llama 3.1) available on every page |
| 📝 **Resume Studio** | AI-powered resume analysis with match scoring, keyword suggestions, and section improvements |
| 🎯 **Interview Prep** | Generate role-specific questions and get AI-scored answers with detailed feedback |
| 📋 **Assessment Hub** | AI-evaluated assessments with per-question scoring, grading, and feedback |
| 📊 **Skill Gap Analysis** | Identify areas for improvement based on job requirements |
| 💼 **Job Browser** | Search, filter, and apply to jobs with one click |
| 📧 **Email Notifications** | Automated EmailJS-powered notifications for status updates, interviews, assessments, and messages |
| 👥 **Recruiter Pipeline** | Drag-and-manage candidate pipeline with status tracking |
| 📈 **Application Timeline** | Visual stage-by-stage progress tracker for each application |
| 💬 **Real-time Messages** | Direct communication between candidates and recruiters |
| ⚙️ **Settings** | Profile management, notification preferences, security, and appearance |
| ❓ **Help Center** | Searchable FAQs and platform documentation |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS + Shadcn/ui |
| **State** | Zustand (UI state) + React Query (server state) |
| **Backend** | Supabase (Auth, PostgreSQL, Storage, RLS) |
| **AI** | Groq API (Llama 3.1 8B Instant) |
| **Email** | EmailJS |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Routing** | React Router v6 |

---

## 📁 Project Structure

```
carrier-compas/
├── public/                     # Static assets
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── layout/             # AppSidebar, TopBar, PageWrapper
│   │   ├── ui/                 # Badge, Skeleton, EmptyState, ErrorState, etc.
│   │   └── AICopilot.tsx       # AI chat drawer
│   ├── contexts/
│   │   └── AuthContext.tsx      # Authentication provider
│   ├── lib/
│   │   ├── ai.ts               # Groq AI functions (resume, interview, copilot)
│   │   ├── api.ts              # Supabase API calls
│   │   ├── email.ts            # EmailJS notification helpers
│   │   ├── supabase.ts         # Supabase client
│   │   └── utils.ts            # Utility functions
│   ├── pages/
│   │   ├── recruiter/          # Recruiter-specific pages
│   │   │   ├── RecruiterDashboard.tsx
│   │   │   ├── JobManagement.tsx
│   │   │   ├── CandidatePipeline.tsx
│   │   │   └── AssessmentManagement.tsx
│   │   ├── Dashboard.tsx       # Candidate dashboard
│   │   ├── Applications.tsx    # Application list
│   │   ├── ApplicationDetail.tsx # Timeline + detail view
│   │   ├── AssessmentHub.tsx   # AI-scored assessments
│   │   ├── InterviewPrep.tsx   # AI interview practice
│   │   ├── ResumeStudio.tsx    # AI resume analysis
│   │   ├── BrowseJobs.tsx      # Job search
│   │   ├── SkillGapAnalysis.tsx
│   │   ├── Messages.tsx        # Chat
│   │   ├── Settings.tsx        # Account settings
│   │   ├── Profile.tsx         # User profile
│   │   ├── Help.tsx            # Help center
│   │   ├── Auth.tsx            # Login/Signup
│   │   └── Landing.tsx         # Public landing page
│   ├── store/
│   │   └── appStore.ts         # Zustand UI store
│   ├── App.tsx                 # Routes + layout
│   └── main.tsx                # Entry point
├── supabase/
│   └── update.sql              # Database migrations
├── .env                        # Environment variables (not committed)
└── package.json
```

---

## ⚡ Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- A **Supabase** project ([supabase.com](https://supabase.com))
- A **Groq** API key ([console.groq.com](https://console.groq.com))
- An **EmailJS** account ([emailjs.com](https://www.emailjs.com))

### 1. Clone & Install

```bash
git clone https://github.com/your-username/carrier-compas.git
cd carrier-compas
npm install
```

### 2. Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GROQ_API_KEY=your-groq-api-key
```

### 3. Database Setup

Run the SQL migration in your Supabase SQL Editor:

```bash
# Copy the contents of supabase/update.sql and execute in Supabase SQL Editor
```

This creates the required tables:
- `profiles` — User profiles with role-based access
- `jobs` — Job postings
- `applications` — Candidate applications
- `application_stages` — Timeline stages per application
- `assessments` — AI-scored assessments with JSONB responses
- `interviews` — Scheduled interviews
- `messages` — Candidate-recruiter communication

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 5. Build for Production

```bash
npm run build
npm run preview
```

---

## 🔐 Authentication & Roles

CandidateOS uses **Supabase Auth** with two roles:

| Role | Access |
|------|--------|
| **Candidate** | Dashboard, Browse Jobs, Applications, Resume Studio, Assessments, Interview Prep, Messages, Skill Gap Analysis |
| **Recruiter** | Recruiter Dashboard, Job Postings, Candidate Pipeline, Assessment Management, Messages |

Both roles have access to **Settings**, **Profile**, **Help**, and the **AI Copilot**.

Row-Level Security (RLS) is enforced on all tables to ensure data isolation between users.

---

## 🤖 AI Features

All AI features are powered by **Groq** using the `llama-3.1-8b-instant` model:

| Feature | Function | Description |
|---------|----------|-------------|
| Resume Tailoring | `tailorResume()` | Analyzes resume against job description, provides match score and suggestions |
| Interview Questions | `generateInterviewQuestions()` | Generates role-specific questions with coaching tips |
| Answer Evaluation | `evaluateAnswer()` | Scores answers 1-10 with grade and detailed feedback |
| Skill Gap Analysis | `analyzeSkillGaps()` | Identifies missing skills and recommends learning paths |
| AI Copilot | `copilotChat()` | Contextual career chat assistant with conversation memory |

Input truncation is applied to stay within Groq's free-tier rate limits.

---

## 📧 Email Notifications

Automated email notifications via **EmailJS** are triggered on:

- 📅 Interview scheduled
- 📋 Assessment assigned
- 📊 Assessment scored
- 🔄 Application status change
- 💬 New message received

All notifications use a single `{{message}}` template variable for flexible formatting.

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

---

## 📄 License

This project belongs to Chaitanya Hiran#   C a n d i d a t e - O S 
 
 
