# Cosmic Academy Management System

A modern, professional web-based Academic English Institute Management System with role-based authentication and comprehensive admin dashboard.

## 🚀 Features

### Admin Dashboard

- ✅ **Authentication** - JWT-based login with role selection
- ✅ **Dashboard** - Real-time statistics (students, teachers, revenue, courses)
- ✅ **Course Management** - Create, edit, delete courses and assign teachers
- ✅ **User Management** - Create and manage teacher/student accounts
- ✅ **Enrollment Management** - Enroll students in courses and track progress
- ✅ **Payment Tracking** - Monitor payment status (paid, pending, partial)
- ✅ **Level Management** - Manage course levels (Beginner, Intermediate, Advanced)
- ✅ **Dark/Light Mode** - Toggle between themes
- ✅ **Responsive Design** - Works on all devices

## 🛠️ Tech Stack

**Backend:**

- FastAPI (Python)
- MySQL / XAMPP
- SQLAlchemy ORM
- JWT Authentication
- Pydantic validation
- Cloudinary (Media Hosting)

**Frontend:**

- React 18
- Vite
- Tailwind CSS
- Framer Motion (animations)
- React Query (data fetching)
- Axios (API client)

## 📋 Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL (via XAMPP or native)
- Cloudinary Account (for media)

## 🔧 Installation

### 1. Database Setup

Start XAMPP, open phpMyAdmin, and create a new empty database:

```sql
CREATE DATABASE academic_system;
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies (already done)
# pip install -r requirements.txt

# Update .env file with your database credentials and Cloudinary URL
# DATABASE_URL=mysql+pymysql://root:@localhost:3306/academic_system
# CLOUDINARY_URL=cloudinary://...

# Initialize database and create tables
python init_db.py
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (already done)
# npm install
```

## 🚀 Running the Application

### Start Backend Server

```bash
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The application will be available at: `http://localhost:5173`

## 🔐 Default Login Credentials

**Admin Account:**

- Email: `admin@cosmic.academy`
- Password: `admin123`
- Role: Admin

## 📁 Project Structure

```
Academic System/
├── backend/
│   ├── models/          # Database models
│   ├── routers/         # API endpoints
│   │   └── admin/       # Admin-specific routes
│   ├── schemas/         # Pydantic schemas
│   ├── auth/            # Authentication logic
│   ├── venv/            # Virtual environment
│   ├── config.py        # Configuration
│   ├── database.py      # Database setup
│   ├── main.py          # FastAPI app
│   └── init_db.py       # Database initialization
│
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   │   ├── admin/   # Admin components
    │   │   ├── auth/    # Auth components
    │   │   └── ui/      # UI components
    │   ├── contexts/    # React contexts
    │   ├── layouts/     # Page layouts
    │   ├── pages/       # Page components
    │   │   └── admin/   # Admin pages
    │   ├── utils/       # Utilities
    │   └── App.jsx      # Main app component
    └── package.json
```

## 🎨 Design Features

- **Modern SaaS UI** - Clean, professional interface inspired by Notion
- **Cosmic Academy Branding** - Red (#E53E3E) and dark theme colors
- **Smooth Animations** - Framer Motion for delightful interactions
- **Dark Mode** - Full dark mode support with theme toggle
- **Responsive** - Mobile-first design

## 🔜 Future Phases

- **Phase 2:** Teacher Dashboard (Quiz creation, attendance, analytics)
- **Phase 3:** Student Dashboard (Take quizzes, view progress)
- **Phase 4:** AI speaking feature integration

## 📝 Notes

- Backend uses Python virtual environment (`venv/`)
- Frontend uses Vite for fast development
- All API endpoints are prefixed with `/api` in frontend
- JWT tokens stored in localStorage
- Database migrations handled by SQLAlchemy

## 🐛 Troubleshooting

**Backend won't start:**

- Check MySQL (XAMPP) is running
- Verify database credentials in `.env`
- Verify Cloudinary URL in `.env`
- Ensure virtual environment is activated

**Frontend won't start:**

- Check Node.js version (18+)
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

**Cannot login:**

- Ensure backend server is running
- Check browser console for errors
- Verify database was initialized: `python init_db.py`

---

Built with ❤️ for Cosmic Academy
