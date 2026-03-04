import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Courses from './pages/admin/Courses';
import Teachers from './pages/admin/Teachers';
import Students from './pages/admin/Students';
import Enrollments from './pages/admin/Enrollments';
import Payments from './pages/admin/Payments';


import TeacherLayout from './layouts/TeacherLayout';
import TeacherDashboard from './pages/teacher/Dashboard';
import MyCourses from './pages/teacher/MyCourses';
import CourseDetails from './pages/teacher/CourseDetails';
import MyStudents from './pages/teacher/MyStudents';
import QuizList from './pages/teacher/QuizList';
import QuizBuilder from './pages/teacher/QuizBuilder';
import QuizResults from './pages/teacher/QuizResults';

import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import MyLearning from './pages/student/MyCourses';
import StudentCourseDetails from './pages/student/CourseDetails';
import MyPayments from './pages/student/MyPayments';
import StudentQuizzes from './pages/student/Quizzes';
import QuizTake from './pages/student/QuizTake';
import Profile from './pages/shared/Profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="courses" element={<Courses />} />
                <Route path="teachers" element={<Teachers />} />
                <Route path="students" element={<Students />} />
                <Route path="enrollments" element={<Enrollments />} />
                <Route path="payments" element={<Payments />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Teacher Routes */}
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute requiredRole="TEACHER">
                    <TeacherLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<TeacherDashboard />} />
                <Route path="courses" element={<MyCourses />} />
                <Route path="courses/:id" element={<CourseDetails />} />
                <Route path="students" element={<MyStudents />} />
                <Route path="quizzes" element={<QuizList />} />
                <Route path="quizzes/new" element={<QuizBuilder />} />
                <Route path="quizzes/:quizId/edit" element={<QuizBuilder />} />
                <Route path="quizzes/:quizId/results" element={<QuizResults />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Student Routes */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute requiredRole="STUDENT">
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StudentDashboard />} />
                <Route path="courses" element={<MyLearning />} />
                <Route path="courses/:id" element={<StudentCourseDetails />} />
                <Route path="payments" element={<MyPayments />} />
                <Route path="quizzes" element={<StudentQuizzes />} />
                <Route path="quizzes/:quizId/take" element={<QuizTake />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
