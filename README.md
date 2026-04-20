# SpeakUP — Academic English Institute Management System

<div align="center">

![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.2.0-blue?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-yellow?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A full-stack, enterprise-grade management platform for English language institutes.**  
Built to digitize every aspect of institute operations — from enrollment and billing to AI-powered conversation tutoring.

</div>

---

## 🚀 Live Demo

**Link:** [https://academic-system-gold.vercel.app/login](https://academic-system-gold.vercel.app/login)

> **⚠️ Note:** The backend is deployed on a free hosting tier. When you first attempt to login, it may take **1 to 2 minutes** for the server to wake up from inactivity. Please be patient!

### Demo Accounts
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@speakup.academy` | `admin123` |
| **Student** | `husseinabbod@gmail.com` | `hussein123` |
| **Teacher** | `aliahmed@gmail.com` | `ali123` |

---

## 📖 Overview

SpeakUP is a comprehensive Academic Management System designed for English language institutes. It provides a unified platform for administrators, teachers, and students — covering course management, attendance, payments, real-time analytics, and an integrated AI Language Tutor powered by Groq LLMs.

---

## ✨ Feature Highlights

### 🛡️ Administrator Portal
- **Role-Based Access Control (RBAC)** — Strict JWT-secured separation between Admin, Teacher, and Student roles.
- **Interactive Dashboard** — Live revenue charts (filterable by 6 months, 1 year, all time), enrollment statistics, and a financial overview.
- **Course & Level Management** — Full CRUD for courses with proficiency levels (Beginner, Intermediate, Advanced) and monthly pricing.
- **Enrollment Management** — Assign students to courses, track status (Active / Completed / Dropped), and view the full enrollment table.
- **Payment Management** — Record and track student payments per enrollment or AI subscription. Supports Paid, Pending, and Partial statuses.
- **Attendance Tracking** — Mark and review student attendance records per course session.
- **Quiz Management** — Create and publish quizzes linked to specific courses.
- **Student & Teacher Profiles** — Manage user accounts, profile photos (via Cloudinary), and personal details.

### 🤖 AI Language Advisor (Subscription Feature)
- **Admin-Assigned Subscriptions** — Admins assign students to the AI Advisor directly from the Enrollment page, with configurable:
  - Proficiency level (Basic / Intermediate / Advanced)
  - Daily session time limit (minutes)
  - Monthly subscription fee
- **Edit & Revoke** — Admins can update subscription settings or revoke access at any time.
- **Financial Integration** — AI subscription fees appear in both the admin Payments module and the student's payment history alongside standard course fees.
- **Billing Tracking** — Monthly fees are tracked from enrollment date, and outstanding balances are calculated automatically.

### 🧠 AI Conversation Tutor (Student Feature)
- **Groq-Powered LLM** — Conversational AI tutor using `llama-3.3-70b-versatile` model via Groq API.
- **Level-Adaptive Responses** — The AI dynamically adjusts complexity and vocabulary to the student's assigned proficiency level (A1/A2 → C1/C2).
- **Grammar Correction** — Every reply includes a gentle correction or praise for the student's previous message.
- **Daily Limit Enforcement** — Sessions are tracked and capped at the admin-configured daily minute limit.
- **Instant Translation** — Built-in text translator that returns a clean, direct translation into the student's native language, no explanations.

### 🎓 Student Portal
- **Personal Dashboard** — Overview of active/completed courses, outstanding balance, and AI Advisor status.
- **My Courses** — View enrolled courses, progress, and course details.
- **My Payments** — Full payment history split between courses and AI subscription fees, with balance tracking.
- **Notification Center** — Real-time dropdown notifications for:
  - New quiz publications
  - Payment confirmations
  - Enrollment confirmations (courses & AI Advisor)
  - Attendance records
- **AI Tutor Access** — Chat interface with session timer, message history, and the instant translation tool.

### 👨‍🏫 Teacher Portal
- **Course Dashboard** — Overview of assigned courses and enrolled students.
- **Attendance Management** — Mark and update attendance records.
- **Quiz Creator** — Build and publish quizzes for enrolled students.
- **Student Progress** — View student profiles and track performance.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy ORM |
| **Database** | MySQL (local via XAMPP or cloud via Aiven) |
| **Authentication** | JWT (OAuth2 Bearer) via `python-jose` |
| **AI Integration** | Groq API — `llama-3.3-70b-versatile` |
| **Media Storage** | Cloudinary |
| **Frontend** | React 18, Vite, TanStack Query (React Query), Axios |
| **Styling** | Tailwind CSS, Framer Motion |
| **Charts** | Recharts |

---

## 📋 Prerequisites

- **Python** `3.10+`
- **Node.js** `18.0+`
- **MySQL** (via XAMPP or any MySQL-compatible service)
- **Groq API Key** — [Get one free at groq.com](https://console.groq.com)
- **Cloudinary Account** — [cloudinary.com](https://cloudinary.com) *(optional, for profile photos)*

---

## 🚀 Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Hussein-abbod/academic-system.git
cd academic-system
```

### 2. Database Setup
```sql
CREATE DATABASE academic_system;
```

### 3. Backend Setup
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file inside the `backend/` directory:
```env
# Database
DATABASE_URL=mysql+pymysql://root:@localhost:3306/academic_system

# JWT
SECRET_KEY=your_strong_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Groq AI
GROQ_API_KEY=your_groq_api_key_here

# Cloudinary (optional)
CLOUDINARY_URL=cloudinary://your_cloudinary_url_here

# App
DEBUG=false
CORS_ORIGINS=["http://localhost:5173"]
```

### 5. Initialize the Database & Run Backend
```bash
# Seed tables and default admin account
python init_db.py

# Start the API server
uvicorn main:app --reload
```

### 6. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 7. Access the Application
| Service | URL |
|---|---|
| Frontend App | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## 🔐 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@speakup.academy` | `admin123` |

> **Note:** Change this password immediately after first login in a production environment.

---

## 📁 Project Structure

```
academic-system/
├── backend/
│   ├── auth/               # JWT token services & dependencies
│   ├── models/             # SQLAlchemy database models
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── enrollment.py
│   │   ├── payment.py
│   │   ├── attendance.py
│   │   ├── quiz.py
│   │   └── ai_advisor.py
│   ├── routers/            # API route controllers
│   │   ├── admin/          # Admin-specific routes
│   │   ├── student/        # Student-specific routes
│   │   ├── teacher/        # Teacher-specific routes
│   │   ├── admin_ai.py     # AI subscription management
│   │   ├── student_ai.py   # AI tutor chat & translation
│   │   └── notifications.py
│   ├── schemas/            # Pydantic request/response models
│   ├── config.py           # App configuration & env loading
│   ├── database.py         # SQLAlchemy engine & session
│   ├── init_db.py          # DB seeder
│   └── main.py             # FastAPI app entry point
└── frontend/
    └── src/
        ├── components/     # Reusable UI components
        │   ├── dashboard/  # Charts & dashboard widgets
        │   ├── shared/     # Navbar, notifications dropdown
        │   └── ui/         # Buttons, cards, modals, tables
        ├── contexts/       # Auth & Theme React contexts
        ├── layouts/        # Admin, Student, Teacher shell layouts
        ├── pages/          # Route-level views
        │   ├── admin/
        │   ├── student/
        │   └── teacher/
        └── utils/          # Axios API adapter & helpers
```

---

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

<div align="center">

Built with ❤️ as a holistic demonstration of modern full-stack engineering — FastAPI, React, AI integration, and enterprise-grade UX.

</div>
