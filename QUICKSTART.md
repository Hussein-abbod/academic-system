# Quick Start Guide

## Step-by-Step Setup

### 1. Start PostgreSQL

Make sure PostgreSQL is running on your machine.

### 2. Create Database

Open PostgreSQL command line or pgAdmin and run:

```sql
CREATE DATABASE academic_system;
```

### 3. Initialize Database

```bash
cd backend
.\venv\Scripts\activate
python init_db.py
```

This creates:

- All database tables
- Default admin user (email: admin@cosmic.academy, password: admin123)
- Default levels (Beginner, Intermediate, Advanced)

### 4. Start Backend Server

```bash
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

Keep this terminal open. Backend should start at http://localhost:8000

### 5. Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

Frontend should start at http://localhost:5173

### 6. Login

- Go to http://localhost:5173
- Email: admin@cosmic.academy
- Password: admin123
- Role: Admin

## Troubleshooting

**PostgreSQL not found:**

- Install PostgreSQL from https://www.postgresql.org/download/
- Ensure it's added to PATH
- Start PostgreSQL service

**Python errors:**

- Make sure virtual environment is activated
- Check Python version: `python --version` (need 3.10+)
- Reinstall dependencies: `pip install -r requirements.txt`

**Frontend errors:**

- Check Node version: `node --version` (need 18+)
- Reinstall: `rm -rf node_modules package-lock.json && npm install`
