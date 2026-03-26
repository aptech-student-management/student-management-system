import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  XIcon,
  UserCircleIcon,
  BookmarkIcon,
  ClockIcon,
  FileTextIcon,
  UserIcon,
  ChevronRightIcon,
  ListChecksIcon,
  BotIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { Role } from '../../types';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const adminNav: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: <LayoutDashboardIcon className="h-4 w-4" />
  },
  {
    label: 'Khoa',
    path: '/admin/departments',
    icon: <BuildingIcon className="h-4 w-4" />
  },
  {
    label: 'Lớp học',
    path: '/admin/classes',
    icon: <UsersIcon className="h-4 w-4" />
  },
  {
    label: 'Môn học',
    path: '/admin/subjects',
    icon: <BookOpenIcon className="h-4 w-4" />
  },
  {
    label: 'Tài khoản',
    path: '/admin/users',
    icon: <UserCircleIcon className="h-4 w-4" />
  },
  {
    label: 'Học kỳ & Lớp HP',
    path: '/admin/semesters',
    icon: <CalendarIcon className="h-4 w-4" />
  },
  {
    label: 'AI Chatbot',
    path: '/chatbot',
    icon: <BotIcon className="h-4 w-4" />
  }
];

const lecturerNav: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/lecturer',
    icon: <LayoutDashboardIcon className="h-4 w-4" />
  },
  {
    label: 'Lớp học của tôi',
    path: '/lecturer/classes',
    icon: <BookOpenIcon className="h-4 w-4" />
  },
  {
    label: 'Điểm danh',
    path: '/lecturer/attendance',
    icon: <ListChecksIcon className="h-4 w-4" />
  },
  {
    label: 'Nhập điểm',
    path: '/lecturer/grades',
    icon: <ClipboardListIcon className="h-4 w-4" />
  },
  {
    label: 'AI Chatbot',
    path: '/chatbot',
    icon: <BotIcon className="h-4 w-4" />
  }
];

const studentNav: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/student',
    icon: <LayoutDashboardIcon className="h-4 w-4" />
  },
  {
    label: 'Đăng ký môn học',
    path: '/student/registration',
    icon: <BookmarkIcon className="h-4 w-4" />
  },
  {
    label: 'Thời khóa biểu',
    path: '/student/schedule',
    icon: <ClockIcon className="h-4 w-4" />
  },
  {
    label: 'Bảng điểm',
    path: '/student/transcript',
    icon: <FileTextIcon className="h-4 w-4" />
  },
  {
    label: 'AI Chatbot',
    path: '/chatbot',
    icon: <BotIcon className="h-4 w-4" />
  },
  {
    label: 'Hồ sơ',
    path: '/student/profile',
    icon: <UserIcon className="h-4 w-4" />
  }
];

const roleConfig: Record<Role, { nav: NavItem[]; label: string }> = {
  ADMIN: {
    nav: adminNav,
    label: 'Quản trị viên'
  },
  LECTURER: {
    nav: lecturerNav,
    label: 'Giảng viên'
  },
  STUDENT: {
    nav: studentNav,
    label: 'Sinh viên'
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

  const SidebarContent = () => (
    <div className="ui-sidebar-shell flex h-full flex-col text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] ring-1 ring-white/5">
          <GraduationCapIcon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight text-white">UniEdu</p>
          <p className="text-xs leading-tight text-white/60">Quản lý Đào tạo</p>
        </div>
        <button
          onClick={onMobileClose}
          className="ml-auto rounded-xl p-1 text-white/60 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 py-3">
        <span className="ui-sidebar-role-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em]">
          <BarChart3Icon className="h-3 w-3" />
          {config.label}
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            className={`ui-sidebar-item group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
              isActive(item.path) ? 'ui-sidebar-item-active' : ''
            }`}
          >
            <span
              className={`flex-shrink-0 ${
                isActive(item.path)
                  ? 'text-white'
                  : 'text-white/50 group-hover:text-white/85'
              }`}
            >
              {item.icon}
            </span>
            <span className="flex-1 text-left">{item.label}</span>
            {isActive(item.path) && (
              <ChevronRightIcon className="h-3 w-3 text-white/60" />
            )}
          </button>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-bold text-white">
            {(currentUser.name ?? '').charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">
              {currentUser.name}
            </p>
            <p className="truncate text-xs text-white/50">
              {currentUser.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="ui-sidebar-item flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
        >
          <LogOutIcon className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="ui-panel-surface hidden h-full w-64 flex-shrink-0 overflow-hidden rounded-[30px] lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
          />

          <aside className="absolute bottom-0 left-0 top-0 z-50 w-64 overflow-hidden rounded-r-[26px] shadow-[0_24px_64px_-34px_rgba(0,0,0,0.5)]">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
