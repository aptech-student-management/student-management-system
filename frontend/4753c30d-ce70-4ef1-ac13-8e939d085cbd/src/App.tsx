import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation } from
'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import type { Role } from './types';
// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DepartmentManagement } from './pages/admin/DepartmentManagement';
import { ClassManagement } from './pages/admin/ClassManagement';
import { SubjectManagement } from './pages/admin/SubjectManagement';
import { UserManagement } from './pages/admin/UserManagement';
import { SemesterManagement } from './pages/admin/SemesterManagement';
import { AuditLog } from './pages/admin/AuditLog';
import { LecturerDashboard } from './pages/lecturer/LecturerDashboard';
import { MyClasses } from './pages/lecturer/MyClasses';
import { AttendanceManagement } from './pages/lecturer/AttendanceManagement';
import { GradeManagement } from './pages/lecturer/GradeManagement';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CourseRegistration } from './pages/student/CourseRegistration';
import { Schedule } from './pages/student/Schedule';
import { Transcript } from './pages/student/Transcript';
import { ProfilePage } from './pages/shared/ProfilePage';
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
}
function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Đang tải...</p>
        </div>
      </div>);

  }
  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location
        }}
        replace />);


  }
  if (requiredRole && currentUser.role !== requiredRole) {
    // Redirect to appropriate dashboard
    if (currentUser.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (currentUser.role === 'LECTURER')
    return <Navigate to="/lecturer" replace />;
    return <Navigate to="/student" replace />;
  }
  return <>{children}</>;
}
function RoleRedirect() {
  const { currentUser, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>);

  }
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (currentUser.role === 'LECTURER')
  return <Navigate to="/lecturer" replace />;
  return <Navigate to="/student" replace />;
}
function AppRoutes() {
  const { currentUser } = useAuth();
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={currentUser ? <RoleRedirect /> : <LoginPage />} />

      <Route
        path="/register"
        element={currentUser ? <RoleRedirect /> : <RegisterPage />} />


      {/* Root redirect */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
        <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        } />

      <Route
        path="/admin/departments"
        element={
        <ProtectedRoute requiredRole="ADMIN">
            <DepartmentManagement />
          </ProtectedRoute>
        } />

      <Route
        path="/admin/classes"
        element={
        <ProtectedRoute requiredRole="ADMIN">
            <ClassManagement />
          </ProtectedRoute>
        } />

      <Route
        path="/admin/subjects"
        element={
        <ProtectedRoute requiredRole="ADMIN">
            <SubjectManagement />
          </ProtectedRoute>
        } />

      <Route
        path="/admin/users"
        element={
        <ProtectedRoute requiredRole="ADMIN">
            <UserManagement />
          </ProtectedRoute>
        } />

      <Route
        path="/admin/semesters"
        element={
        <ProtectedRoute requiredRole="ADMIN">
            <SemesterManagement />
          </ProtectedRoute>
        } />

      <Route
        path="/admin/audit"
        element={
        <ProtectedRoute requiredRole="ADMIN">
            <AuditLog />
          </ProtectedRoute>
        } />

      <Route
        path="/admin/profile"
        element={
        <ProtectedRoute requiredRole="ADMIN">
            <ProfilePage />
          </ProtectedRoute>
        } />


      {/* Lecturer routes */}
      <Route
        path="/lecturer"
        element={
        <ProtectedRoute requiredRole="LECTURER">
            <LecturerDashboard />
          </ProtectedRoute>
        } />

      <Route
        path="/lecturer/classes"
        element={
        <ProtectedRoute requiredRole="LECTURER">
            <MyClasses />
          </ProtectedRoute>
        } />

      <Route
        path="/lecturer/attendance"
        element={
        <ProtectedRoute requiredRole="LECTURER">
            <AttendanceManagement />
          </ProtectedRoute>
        } />

      <Route
        path="/lecturer/grades"
        element={
        <ProtectedRoute requiredRole="LECTURER">
            <GradeManagement />
          </ProtectedRoute>
        } />

      <Route
        path="/lecturer/profile"
        element={
        <ProtectedRoute requiredRole="LECTURER">
            <ProfilePage />
          </ProtectedRoute>
        } />


      {/* Student routes */}
      <Route
        path="/student"
        element={
        <ProtectedRoute requiredRole="STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        } />

      <Route
        path="/student/registration"
        element={
        <ProtectedRoute requiredRole="STUDENT">
            <CourseRegistration />
          </ProtectedRoute>
        } />

      <Route
        path="/student/schedule"
        element={
        <ProtectedRoute requiredRole="STUDENT">
            <Schedule />
          </ProtectedRoute>
        } />

      <Route
        path="/student/transcript"
        element={
        <ProtectedRoute requiredRole="STUDENT">
            <Transcript />
          </ProtectedRoute>
        } />

      <Route
        path="/student/profile"
        element={
        <ProtectedRoute requiredRole="STUDENT">
            <ProfilePage />
          </ProtectedRoute>
        } />


      {/* 404 */}
      <Route
        path="*"
        element={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <p className="text-6xl font-bold text-slate-200 mb-4">404</p>
              <p className="text-slate-600 mb-6">Trang không tồn tại</p>
              <a
              href="/"
              className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors">

                Về trang chủ
              </a>
            </div>
          </div>
        } />

    </Routes>);

}
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>);

}