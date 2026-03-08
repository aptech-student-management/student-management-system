import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MenuIcon,
  ChevronDownIcon,
  UserIcon,
  LogOutIcon
} from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
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
    <header className="h-16 backdrop-blur bg-white/80 border-b border-slate-200 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-40">

      {/* Mobile Menu */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition"
      >
        <MenuIcon className="w-5 h-5 text-slate-600" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 truncate tracking-tight">
          {title}
        </h1>
      </div>

      {/* User Menu */}
      <div className="relative" ref={menuRef}>

        <button
          onClick={() => setMenuOpen(v => !v)}
          className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
        >

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {(currentUser.name ?? "").charAt(0)}
          </div>

          {/* Name + role */}
          <div className="hidden sm:block text-left leading-tight">

            <p className="text-xs font-semibold text-slate-800 max-w-[130px] truncate">
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
            className={`w-4 h-4 text-slate-400 transition-transform ${
              menuOpen ? 'rotate-180' : ''
            }`}
          />

        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 py-2 animate-fade-in">

            {/* User Info */}
            <div className="px-4 py-3 border-b border-slate-100">

              <p className="text-sm font-semibold text-slate-900 truncate">
                {currentUser.name}
              </p>

              <p className="text-xs text-slate-500 truncate">
                {currentUser.email}
              </p>

            </div>

            {/* Profile */}
            <button
              onClick={() => {
                navigate(getProfilePath())
                setMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <UserIcon className="w-4 h-4 text-slate-400" />
              Hồ sơ cá nhân
            </button>

            {/* Logout */}
            <div className="border-t border-slate-100 mt-1 pt-1">

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
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