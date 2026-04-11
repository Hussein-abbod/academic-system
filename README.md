# SpeakUP Academy Management System

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Python](https://img.shields.io/badge/Python-3.10+-yellow)
![React](https://img.shields.io/badge/React-18-cyan)

A robust, enterprise-grade **Academic English Institute Management System** engineered for scalability and performance. Built with a modern full-stack ecosystem to digitize and manage complete institute operations, including role-based authentication, course scheduling, enrollment tracking, and interactive real-time dashboard analytics.

## 🌟 Project Overview

This architecture was specifically developed to bridge the gap between traditional academic institute administration and modern digital transformation. It centralizes student operations, teacher management, and administrative oversight into a cohesive, secure interface. The system ensures robust data integrity, enforces strict access control through JWT authentication, and delivers actionable insights to stakeholders.

---

## 🚀 Key Technical Features

### 🛡️ Robust Administrative & Security Controls
- **Role-Based Access Control (RBAC)**: Comprehensive security using JWT tokens allowing strict context separation for Admins, Teachers, and Students.
- **Analytics Dashboard**: Aggregated real-time metrics for active user retention, financial charting, teacher utilization, and live active courses.
- **Course & Level Lifecycle**: Zero-friction CRUD infrastructure for multi-tiered proficiency courses (Beginner, Intermediate, Advanced).

### 👥 User & Enrollment Optimization
- **Entity Lifecycle Management**: Intuitive dashboard screens to onboard and oversee teacher capacities and student profiles.
- **Streamlined Workflow**: Secure course assignments mapping students functionally to tracking arrays.
- **Financial Status Management**: Modular transaction models mapping tuition logs (Paid, Pending, Partial).

### 🎨 Progressive UI/UX System
- **Responsive Architecture**: Mobile-first fluid interface leveraging complete Tailwind CSS grid/flex optimizations.
- **Dynamic Theming Integration**: Centralized UI state enabling live dark/light mode toggling based on native preferences.
- **Micro-Interactions**: Enriched with `framer-motion` to provide a snappy, application-like experience feeling organic and premium.

---

## 🛠⚙️ Technical Architecture & Stack

### Backend Services (API)
- **Framework:** FastAPI (Python) - *Adopted for unparalleled async performance and rapid REST API delivery.*
- **Database Architecture:** Relational DB (MySQL) orchestrated via **SQLAlchemy ORM**.
- **Data Validation & Parsing:** Pydantic - *Strict static type checking to prevent injection and format errors.*
- **Cloud Infrastructure:** Integrated with **Cloudinary** for high-availability media/asset delivery.

### Frontend Client
- **Core Library:** React 18 coupled with Vite.js - *Resulting in micro-second Fast Refresh compilation and highly optimized build assets.*
- **Global State / Remote Caching:** React Query & Axios - *Asynchronous state management reducing redundant API hits.*
- **Styling Pipeline:** Tailwind CSS.

---

## 📋 System Requirements

Ensure you have the following installed on your local development machine:

- **Python** `3.10` or higher
- **Node.js** `18.0` or higher
- **Database Service**: MySQL (via XAMPP)
- **Cloudinary Account** (Optional, for media asset testing)

---

## 🔧 Installation & Local Setup 

Follow these steps to bootstrap the system locally.

### 1. Database Configuration
Open your SQL client or CLI and generate the target database:
```sql
CREATE DATABASE academic_system;
```

### 2. Backend Initialization
```bash
# Navigate to the backend directory
cd backend

# Create and activate a pristine Python virtual environment
python -m venv venv
# Windows: .\venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Install strictly verified dependencies
pip install -r requirements.txt

# (Optional) Update your .env file with appropriate URIs:
# DATABASE_URL=mysql+pymysql://root:@localhost:3306/academic_system

# Seed configuration schemas and generate all relational tables
python init_db.py
```

### 3. Frontend Initialization
```bash
# Open a new terminal instance and navigate to frontend
cd frontend

# Install package lock tree
npm install

# Initialize the Vite development server
npm run dev
```

### 4. Running the Application
Once properly initialized, your microservice stack is available at:
- **FastAPI Backend Service:** `http://localhost:8000` 
  - *Interactive API Documentation available at:* `http://localhost:8000/docs`
- **React Frontend Application:** `http://localhost:5173`

---

## 🔐 System Default Testing Credentials

Use the following credentials to access the primary administrative layer:

- **System Administrator Email:** `admin@speakup.academy`
- **Password:** `admin123`
- **Authorization Context:** Admin

---

## 📁 Macro Structure

A brief overview of the folder hierarchy.

```text
SpeakUP Academy System/
├── backend/
│   ├── models/          # Relational Database Mappings (SQLAlchemy)
│   ├── routers/         # Highly Modular Request Controllers 
│   ├── schemas/         # Pydantic Typing/Validation Objects
│   ├── auth/            # JWT Token Services and Encoders
│   └── main.py          # FastAPI ASGI Entry Node
├── frontend/
│   ├── src/
│   │   ├── components/  # Atomic and Composite React Components
│   │   ├── contexts/    # React Contexts (Auth, Theme)
│   │   ├── layouts/     # Primary System Scaffolds
│   │   ├── pages/       # Route-specific View Injection
│   │   └── utils/       # Modular Helpers and API Adapters
│   └── tailwind.config.js
└── README.md
```

---

## 🔜 Strategic Road Map

- [ ] **Phase 2:** Teacher Dashboard Deployment (Quiz orchestration, dynamic grading metrics).
- [ ] **Phase 3:** Student Experience Evolution (Interactive exam interfaces, visual progression timeline).
- [ ] **Phase 4:** Generative AI NLP Integration (Automated speaking fluency evaluations).

---

> Built and conceptualized as a holistic representation of modern software engineering principles and full-stack integration expertise.
