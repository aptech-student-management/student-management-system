import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MenuIcon,
  ChevronDownIcon,
  UserIcon,
  LogOutIcon
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Badge } from '../ui/Badge';
import type { Role } from '../../types';

interface HeaderProps {
  title: string;
  onMobileMenuOpen: () => void;
}

const roleBadgeVariant: Record<Role, 'info'> = {
  ADMIN: 'info',
  LECTURER: 'info',
  STUDENT: 'info'
};

const roleLabel: Record<Role, string> = {
  ADMIN: 'Admin',
  LECTURER: 'Giảng viên',
  STUDENT: 'Sinh viên'
};

export function Header({ title, onMobileMenuOpen }: HeaderProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    <header className="ui-header-surface sticky top-0 z-40 flex h-16 items-center gap-4 px-4 lg:px-6">
      <button
        onClick={onMobileMenuOpen}
        className="ui-subtle-surface ui-subtle-hover rounded-2xl p-2 ui-text-base lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="ui-text-strong truncate text-base font-semibold tracking-tight">
          {title}
        </h1>
      </div>

      <ThemeToggle compact />

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((value) => !value)}
          className="ui-subtle-surface ui-subtle-hover flex items-center gap-3 rounded-2xl px-2.5 py-1.5"
        >
          <div className="ui-accent-surface flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold">
            {(currentUser.name ?? '').charAt(0)}
          </div>

          <div className="hidden text-left leading-tight sm:block">
            <p className="ui-text-strong max-w-[130px] truncate text-xs font-semibold">
              {currentUser.name}
            </p>

            <Badge
              variant={roleBadgeVariant[currentUser.role]}
              className="mt-0.5 px-1.5 py-0 text-[10px]"
            >
              {roleLabel[currentUser.role]}
            </Badge>
          </div>

          <ChevronDownIcon
            className={`ui-text-muted h-4 w-4 transition-transform ${
              menuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {menuOpen && (
          <div className="ui-panel-surface ui-panel-surface-strong absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl py-2">
            <div className="border-b ui-divider px-4 py-3">
              <p className="ui-text-strong truncate text-sm font-semibold">
                {currentUser.name}
              </p>
              <p className="ui-text-muted truncate text-xs">
                {currentUser.email}
              </p>
            </div>

            <button
              onClick={() => {
                navigate(getProfilePath());
                setMenuOpen(false);
              }}
              className="ui-subtle-hover flex w-full items-center gap-3 px-4 py-2.5 text-sm ui-text-base"
            >
              <UserIcon className="ui-text-muted h-4 w-4" />
              Hồ sơ cá nhân
            </button>

            <div className="mt-1 border-t ui-divider pt-1">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50/80 dark:text-red-300 dark:hover:bg-red-500/10"
              >
                <LogOutIcon className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
