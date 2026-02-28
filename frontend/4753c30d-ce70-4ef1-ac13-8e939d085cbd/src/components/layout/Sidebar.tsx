import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  BuildingIcon,
  UsersIcon,
  BookOpenIcon,
  GraduationCapIcon,
  CalendarIcon,
  ClipboardListIcon,
  BarChart3Icon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  UserCircleIcon,
  BookmarkIcon,
  ClockIcon,
  FileTextIcon,
  UserIcon,
  ChevronRightIcon,
  ShieldIcon,
  ListChecksIcon } from
'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { Role } from '../../types';
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}
const adminNav: NavItem[] = [
{
  label: 'Dashboard',
  path: '/admin',
  icon: <LayoutDashboardIcon className="w-4 h-4" />
},
{
  label: 'Khoa',
  path: '/admin/departments',
  icon: <BuildingIcon className="w-4 h-4" />
},
{
  label: 'Lớp học',
  path: '/admin/classes',
  icon: <UsersIcon className="w-4 h-4" />
},
{
  label: 'Môn học',
  path: '/admin/subjects',
  icon: <BookOpenIcon className="w-4 h-4" />
},
{
  label: 'Tài khoản',
  path: '/admin/users',
  icon: <UserCircleIcon className="w-4 h-4" />
},
{
  label: 'Học kỳ & Lớp HP',
  path: '/admin/semesters',
  icon: <CalendarIcon className="w-4 h-4" />
},
{
  label: 'Audit Log',
  path: '/admin/audit',
  icon: <ShieldIcon className="w-4 h-4" />
}];

const lecturerNav: NavItem[] = [
{
  label: 'Dashboard',
  path: '/lecturer',
  icon: <LayoutDashboardIcon className="w-4 h-4" />
},
{
  label: 'Lớp học của tôi',
  path: '/lecturer/classes',
  icon: <BookOpenIcon className="w-4 h-4" />
},
{
  label: 'Điểm danh',
  path: '/lecturer/attendance',
  icon: <ListChecksIcon className="w-4 h-4" />
},
{
  label: 'Nhập điểm',
  path: '/lecturer/grades',
  icon: <ClipboardListIcon className="w-4 h-4" />
}];

const studentNav: NavItem[] = [
{
  label: 'Dashboard',
  path: '/student',
  icon: <LayoutDashboardIcon className="w-4 h-4" />
},
{
  label: 'Đăng ký môn học',
  path: '/student/registration',
  icon: <BookmarkIcon className="w-4 h-4" />
},
{
  label: 'Thời khóa biểu',
  path: '/student/schedule',
  icon: <ClockIcon className="w-4 h-4" />
},
{
  label: 'Bảng điểm',
  path: '/student/transcript',
  icon: <FileTextIcon className="w-4 h-4" />
},
{
  label: 'Hồ sơ',
  path: '/student/profile',
  icon: <UserIcon className="w-4 h-4" />
}];

const roleConfig: Record<
  Role,
  {
    nav: NavItem[];
    accent: string;
    label: string;
    gradient: string;
  }> =
{
  ADMIN: {
    nav: adminNav,
    accent: 'bg-blue-600 text-white',
    label: 'Quản trị viên',
    gradient: 'from-blue-900 to-blue-800'
  },
  LECTURER: {
    nav: lecturerNav,
    accent: 'bg-teal-600 text-white',
    label: 'Giảng viên',
    gradient: 'from-teal-900 to-slate-900'
  },
  STUDENT: {
    nav: studentNav,
    accent: 'bg-sky-600 text-white',
    label: 'Sinh viên',
    gradient: 'from-sky-900 to-slate-900'
  }
};
interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}
export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  if (!currentUser) return null;
  const config = roleConfig[currentUser.role];
  const navItems = config.nav;
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const handleNav = (path: string) => {
    navigate(path);
    onMobileClose();
  };
  const isActive = (path: string) => {
    if (path === '/admin' || path === '/lecturer' || path === '/student') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
  const SidebarContent = () =>
  <div
    className={`h-full flex flex-col bg-gradient-to-b ${config.gradient} text-white`}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <GraduationCapIcon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white leading-tight">UniEdu</p>
          <p className="text-xs text-white/60 leading-tight">Quản lý Đào tạo</p>
        </div>
        <button
        onClick={onMobileClose}
        className="ml-auto lg:hidden p-1 rounded text-white/60 hover:text-white">

          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3">
        <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.accent}`}>

          <BarChart3Icon className="w-3 h-3" />
          {config.label}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
        {navItems.map((item) =>
      <button
        key={item.path}
        onClick={() => handleNav(item.path)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${isActive(item.path) ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>

            <span
          className={`flex-shrink-0 ${isActive(item.path) ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}>

              {item.icon}
            </span>
            <span className="flex-1 text-left">{item.label}</span>
            {isActive(item.path) &&
        <ChevronRightIcon className="w-3 h-3 text-white/60" />
        }
          </button>
      )}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-white/50 truncate">
              {currentUser.email}
            </p>
          </div>
        </div>
        <button
        onClick={handleLogout}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors">

          <LogOutIcon className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </div>;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen &&
      <div className="lg:hidden fixed inset-0 z-40">
          <div
          className="absolute inset-0 bg-black/50"
          onClick={onMobileClose} />

          <aside className="absolute left-0 top-0 bottom-0 w-64 z-50">
            <SidebarContent />
          </aside>
        </div>
      }
    </>);

}