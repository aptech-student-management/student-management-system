import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MenuIcon,
  ChevronDownIcon,
  UserIcon,
  LogOutIcon
} from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Badge } from '../ui/Badge'
import type { Role } from '../../types'

interface HeaderProps {
  title: string
  onMobileMenuOpen: () => void
}

const roleBadgeVariant: Record<Role, 'info' | 'success' | 'neutral'> = {
  ADMIN: 'info',
  LECTURER: 'success',
  STUDENT: 'neutral'
}

const roleLabel: Record<Role, string> = {
  ADMIN: 'Admin',
  LECTURER: 'Giảng viên',
  STUDENT: 'Sinh viên'
}

export function Header({ title, onMobileMenuOpen }: HeaderProps) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  if (!currentUser) return null

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getProfilePath = () => {
    if (currentUser.role === 'STUDENT') return '/student/profile'
    if (currentUser.role === 'LECTURER') return '/lecturer/profile'
    return '/admin/profile'
  }

  /* Close menu when clicking outside */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl lg:px-6 dark:border-slate-800 dark:bg-[#05070b]/85">

      {/* Mobile Menu */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>
      </div>

      <ThemeToggle compact />

      {/* User Menu */}
      <div className="relative" ref={menuRef}>

        <button
          onClick={() => setMenuOpen(v => !v)}
          className="flex items-center gap-3 rounded-2xl pl-2 pr-3 py-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-900"
        >

          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-sm dark:from-slate-600 dark:to-slate-900">
            {(currentUser.name ?? "").charAt(0)}
          </div>

          {/* Name + role */}
          <div className="hidden sm:block text-left leading-tight">

            <p className="max-w-[130px] truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
              {currentUser.name}
            </p>

            <Badge
              variant={roleBadgeVariant[currentUser.role]}
              className="text-[10px] px-1.5 py-0 mt-0.5"
            >
              {roleLabel[currentUser.role]}
            </Badge>

          </div>

          <ChevronDownIcon
            className={`w-4 h-4 text-slate-400 transition-transform dark:text-slate-500 ${
              menuOpen ? 'rotate-180' : ''
            }`}
          />

        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl animate-fade-in dark:border-slate-800 dark:bg-[#090c11]">

            {/* User Info */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">

              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {currentUser.name}
              </p>

              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {currentUser.email}
              </p>

            </div>

            {/* Profile */}
            <button
              onClick={() => {
                navigate(getProfilePath())
                setMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <UserIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              Hồ sơ cá nhân
            </button>

            {/* Logout */}
            <div className="mt-1 border-t border-slate-100 pt-1 dark:border-slate-800">

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
              >
                <LogOutIcon className="w-4 h-4" />
                Đăng xuất
              </button>

            </div>

          </div>
        )}
      </div>

    </header>
  )
}
