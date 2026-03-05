export type Role = 'ADMIN' | 'LECTURER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  avatar?: string;
  studentId?: string;
  lecturerId?: string;
  department?: string;
  departmentId?: string;
  classId?: string;
  phone?: string;
  createdAt: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headLecturerId?: string;
  studentCount: number;
  subjectCount: number;
  description?: string;
}

export interface Class {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  year: number;
  studentCount: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  departmentId: string;
  description?: string;
}

export interface Semester {
  id: string;
  name: string;
  year: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'UPCOMING' | 'CLOSED';
}

export interface CourseSection {
  id: string;
  subjectId: string;
  semesterId: string;
  lecturerId: string;
  classId: string;
  schedule: string;
  room: string;
  maxStudents: number;
  enrolledCount: number;
  status: 'OPEN' | 'CLOSED' | 'FULL';
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseSectionId: string;
  enrolledAt: string;
  status: 'ENROLLED' | 'DROPPED';
}

export interface Attendance {
  id: string;
  studentId: string;
  courseSectionId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface Grade {
  id: string;
  studentId: string;
  courseSectionId: string;
  midterm?: number;
  final?: number;
  attendanceScore?: number;
  totalScore?: number;
  letterGrade?: string;
  gpaPoint?: number;
  updatedBy?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT';
  target: string;
  detail: string;
  timestamp: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}