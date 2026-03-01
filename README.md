# CandidateOS

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

**CandidateOS** is a full-stack AI-powered career platform that connects candidates and recruiters through an intelligent workflow.

### For Candidates

* Apply to jobs
* Take AI-scored assessments
* Practice interviews with real-time feedback
* Optimize resumes using AI
* Track application progress

### For Recruiters

* Post and manage jobs
* Manage candidate pipelines
* Assign assessments
* Schedule interviews
* Communicate with candidates

---

## ✨ Key Features

| Feature                 | Description                                         |
| ----------------------- | --------------------------------------------------- |
| 🧠 AI Copilot           | Contextual assistant powered by Groq (Llama 3.1)    |
| 📝 Resume Studio        | Resume analysis with match scoring and improvements |
| 🎯 Interview Prep       | AI-generated questions with answer evaluation       |
| 📋 Assessment Hub       | AI-evaluated assessments with scoring and feedback  |
| 📊 Skill Gap Analysis   | Identify missing skills and learning paths          |
| 💼 Job Browser          | Search and apply to jobs                            |
| 📧 Email Notifications  | Automated updates via EmailJS                       |
| 👥 Recruiter Pipeline   | Drag-and-manage candidate stages                    |
| 📈 Application Timeline | Visual progress tracker                             |
| 💬 Real-time Messages   | Candidate–recruiter chat                            |
| ⚙️ Settings             | Profile, notifications, and security                |
| ❓ Help Center           | FAQs and documentation                              |

---

## 🏗️ Tech Stack

| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| Frontend   | React 18 + TypeScript                     |
| Build Tool | Vite 5                                    |
| Styling    | Tailwind CSS + Shadcn/ui                  |
| State      | Zustand + React Query                     |
| Backend    | Supabase (Auth, PostgreSQL, Storage, RLS) |
| AI         | Groq (Llama 3.1 8B Instant)               |
| Email      | EmailJS                                   |
| Animations | Framer Motion                             |
| Routing    | React Router v6                           |

---

## 📁 Project Structure

```
carrier-compas/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── ui/
│   │   └── AICopilot.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── ai.ts
│   │   ├── api.ts
│   │   ├── email.ts
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── recruiter/
│   │   ├── Dashboard.tsx
│   │   ├── Applications.tsx
│   │   ├── ApplicationDetail.tsx
│   │   ├── AssessmentHub.tsx
│   │   ├── InterviewPrep.tsx
│   │   ├── ResumeStudio.tsx
│   │   ├── BrowseJobs.tsx
│   │   ├── SkillGapAnalysis.tsx
│   │   ├── Messages.tsx
│   │   ├── Settings.tsx
│   │   ├── Profile.tsx
│   │   ├── Help.tsx
│   │   ├── Auth.tsx
│   │   └── Landing.tsx
│   ├── store/
│   │   └── appStore.ts
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── update.sql
├── .env
└── package.json
```

---

## ⚡ Getting Started

### Prerequisites

* Node.js 18+
* Supabase account
* Groq API key
* EmailJS account

### 1. Clone & Install

```bash
git clone https://github.com/arshadahmedjwork-create/knb.git
cd carrier-compas
npm install
```

### 2. Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
VITE_GROQ_API_KEY=your-key
```

---

### 3. Database Setup

Run the SQL from:

```
supabase/update.sql
```

Tables created:

* profiles
* jobs
* applications
* application_stages
* assessments
* interviews
* messages

---

### 4. Run Development

```bash
npm run dev
```

App runs at:

```
http://localhost:5173
```

---

### 5. Production Build

```bash
npm run build
npm run preview
```

---

## 🔐 Authentication & Roles

| Role      | Access                                                    |
| --------- | --------------------------------------------------------- |
| Candidate | Job search, applications, resume, assessments, interviews |
| Recruiter | Job posting, pipeline, candidate management               |

All tables use **Row Level Security (RLS)** for data isolation.

---

## 🤖 AI Features

Powered by **Groq (llama-3.1-8b-instant)**

| Feature             | Function                       |
| ------------------- | ------------------------------ |
| Resume Tailoring    | Match score + suggestions      |
| Interview Questions | Role-specific generation       |
| Answer Evaluation   | Score + feedback               |
| Skill Gap Analysis  | Missing skills + learning path |
| AI Copilot          | Contextual career assistant    |

---

## 📧 Email Notifications

Triggered for:

* Interview scheduled
* Assessment assigned/scored
* Application status change
* New message

Powered by **EmailJS**.

---

## 🛠️ Scripts

| Command         | Description      |
| --------------- | ---------------- |
| npm run dev     | Start dev server |
| npm run build   | Production build |
| npm run preview | Preview build    |
| npm run lint    | ESLint           |
| npm run test    | Run tests        |

---

## 📄 License

Proprietary – © Chaitanya Hiran

---

## ⭐ Support

If you like this project, give it a **star** on GitHub!
