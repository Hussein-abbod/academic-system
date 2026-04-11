# Quick Start Implementation Guide

This guide provides a streamlined path to standing up the **SpeakUP Academy Management System** on your local machine.

---

## 🚀 Step-by-Step Execution

### 1. Database Initialization
Ensure your relational database engine (PostgreSQL or MySQL) is operational on your machine.

Open your SQL command line interface or visual tool (e.g., pgAdmin / phpMyAdmin) and execute:
```sql
CREATE DATABASE academic_system;
```

### 2. Backend Orchestration Configuration
Navigate to the root directory and establish the backend environment.

```bash
# Enter the backend microservice
cd backend

# Activate your isolated Python environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Execute the database scaffolding script
python init_db.py
```
> **Note:** Executing `init_db.py` handles the creation of all required data schemas via SQLAlchemy and inserts critical seed data, including default role levels (Beginner, Intermediate, Advanced) and the primary administrator system account.

### 3. Activating the Application Layer (API)
With the environment active, start the FastAPI ASGI server:

```bash
uvicorn main:app --reload --port 8000
```
*Keep this terminal window running.* The backend API is now actively listening at `http://localhost:8000`.

### 4. Activating the Presentation Layer (Frontend Client)
Open a **new terminal instance** and navigate to the frontend stack:

```bash
cd frontend

# Verify dependencies are cached
npm install

# Start the Vite HMR server
npm run dev
```
*The React UI application is now broadcasting on `http://localhost:5173`.*

---

## 🔐 System Access and Login

Launch your preferred modern web browser and navigate to the UI client. Use the seeded credentials to access the administrative dashboard.

- **URL:** `http://localhost:5173`
- **Email:** `admin@speakup.academy`
- **Password:** `admin123`
- **Context:** Admin

---

## 🛠️ Common Troubleshooting Strategies

**Database Connection Refused:**
- Validate that the DBMS service (PostgreSQL/MySQL via XAMPP) is actively running in the background.
- Check environmental variables in `.env` to ensure credentials and host targets map correctly to your local setup.

**Runtime Dependency Exceptions (Python):**
- Ensure your virtual environment (`venv`) is activated. You should see `(venv)` prepended to your command prompt line.
- Validate Python build version: `python --version` (Requires strictly `Python 3.10` or greater).
- Force sync dependencies: `pip install --upgrade -r requirements.txt`.

**Build Errors (Node/React):**
- Validate Node ecosystem version: `node --version` (Requires strictly `Node.js 18.0` or greater).
- Should caching issues arise, purge the dependency tree and lockfile, then rebuild: 
  `rm -rf node_modules package-lock.json && npm install`.
