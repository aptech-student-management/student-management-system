import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MenuIcon,
  BellIcon,
  ChevronDownIcon,
  UserIcon,
  LogOutIcon,
  SettingsIcon } from
'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui/Badge';
import type { Role } from '../../types';
interface HeaderProps {
  title: string;
  onMobileMenuOpen: () => void;
}
const roleBadgeVariant: Record<Role, 'info' | 'success' | 'neutral'> = {
  ADMIN: 'info',
  LECTURER: 'success',
  STUDENT: 'neutral'
};
const roleLabel: Record<Role, string> = {
  ADMIN: 'Admin',
  LECTURER: 'Giảng viên',
  STUDENT: 'Sinh viên'
};
export function Header({ title, onMobileMenuOpen }: HeaderProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  if (!currentUser) return null;
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const getProfilePath = () => {
    if (currentUser.role === 'STUDENT') return '/student/profile';
    if (currentUser.role === 'LECTURER') return '/lecturer/profile';
    return '/admin/profile';
  };
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        aria-label="Mở menu">

        <MenuIcon className="w-5 h-5" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 truncate">
          {title}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Thông báo">

          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">

            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
              {(currentUser?.name ?? "").charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight max-w-[120px] truncate">
                {currentUser.name}
              </p>
              <Badge
                variant={roleBadgeVariant[currentUser.role]}
                className="text-[10px] px-1.5 py-0">

                {roleLabel[currentUser.role]}
              </Badge>
            </div>
            <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {userMenuOpen &&
          <>
              <div
              className="fixed inset-0 z-10"
              onClick={() => setUserMenuOpen(false)} />

              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-1 animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {currentUser.email}
                  </p>
                </div>
                <button
                onClick={() => {
                  navigate(getProfilePath());
                  setUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">

                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Hồ sơ cá nhân
                </button>
                <button
                onClick={() => setUserMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">

                  <SettingsIcon className="w-4 h-4 text-slate-400" />
                  Cài đặt
                </button>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">

                    <LogOutIcon className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </>
          }
        </div>
      </div>
    </header>);

}