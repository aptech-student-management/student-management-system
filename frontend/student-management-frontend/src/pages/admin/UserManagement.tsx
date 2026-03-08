import React, { useEffect, useMemo, useState } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  UserIcon
} from 'lucide-react'

import { Layout } from '../../components/layout/Layout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../contexts/ToastContext'

import type { User, Role, Department } from '../../types'

import {
  createAdminUserApi,
  deleteAdminUserApi,
  getAdminUsersApi,
  updateAdminUserApi
} from '../../services/adminUserService'

import { getDepartmentsApi } from '../../services/departmentService'

const PAGE_SIZE = 10

/* ROLE BADGE */

const roleBadge = (role: Role) => {

  const map: Record<Role, { variant: 'info' | 'success' | 'neutral'; label: string }> = {
    ADMIN: { variant: 'info', label: 'Admin' },
    LECTURER: { variant: 'success', label: 'Giảng viên' },
    STUDENT: { variant: 'neutral', label: 'Sinh viên' }
  }

  return (
    <Badge variant={map[role].variant} dot>
      {map[role].label}
    </Badge>
  )
}

export function UserManagement() {

  const { showToast } = useToast()

  const [userList, setUserList] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'ALL' | Role>('ALL')

  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState<User | null>(null)
  const [editing, setEditing] = useState<User | null>(null)

  const [loading, setLoading] = useState(false)

  /* FETCH */

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsersApi()
      setUserList(data)
    } catch {
      showToast('Không thể tải danh sách tài khoản', 'error')
    }
  }

  const fetchDepartments = async () => {
    try {
      const data = await getDepartmentsApi()
      setDepartments(data)
    } catch {
      showToast('Không thể tải danh sách khoa', 'error')
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchDepartments()
  }, [])

  /* STATS */

  const stats = useMemo(() => ({
    total: userList.length,
    admins: userList.filter(u => u.role === 'ADMIN').length,
    lecturers: userList.filter(u => u.role === 'LECTURER').length,
    students: userList.filter(u => u.role === 'STUDENT').length
  }), [userList])

  /* FILTER */

  const filtered = useMemo(() => {

    let result = userList

    if (activeTab !== 'ALL')
      result = result.filter(u => u.role === activeTab)

    if (search)
      result = result.filter(
        u =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )

    return result

  }, [userList, activeTab, search])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const getDeptName = (id?: string) =>
    id ? departments.find(d => d.id === id)?.name ?? '—' : '—'

  /* FORM */

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'STUDENT' as Role,
    departmentId: '',
    phone: '',
    password: ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const openAdd = () => {
    setEditing(null)

    setForm({
      name: '',
      email: '',
      role: 'STUDENT',
      departmentId: '',
      phone: '',
      password: ''
    })

    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (u: User) => {

    setEditing(u)

    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      departmentId: u.departmentId ?? '',
      phone: u.phone ?? '',
      password: ''
    })

    setFormErrors({})
    setModalOpen(true)
  }

  const validate = () => {

    const errs: Record<string, string> = {}

    if (!form.name.trim()) errs.name = 'Vui lòng nhập họ tên'

    if (!form.email.trim()) errs.email = 'Vui lòng nhập email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Email không hợp lệ'

    if (!editing && !form.password)
      errs.password = 'Vui lòng nhập mật khẩu'

    setFormErrors(errs)

    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {

    if (!validate()) return

    setLoading(true)

    try {

      if (editing) {

        await updateAdminUserApi(editing.id, {
          name: form.name,
          email: form.email,
          role: form.role,
          departmentId: form.departmentId || undefined,
          phone: form.phone || undefined,
          password: form.password || undefined
        })

        showToast('Cập nhật tài khoản thành công!', 'success')

      } else {

        await createAdminUserApi({
          name: form.name,
          email: form.email,
          role: form.role,
          departmentId: form.departmentId || undefined,
          phone: form.phone || undefined,
          password: form.password
        })

        showToast('Thêm tài khoản thành công!', 'success')

      }

      await fetchUsers()
      setModalOpen(false)

    } catch (error: any) {

      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Lưu tài khoản thất bại'

      showToast(message, 'error')

    } finally {

      setLoading(false)

    }
  }

  const handleDelete = async () => {

    if (!deleteModal) return

    setLoading(true)

    try {

      await deleteAdminUserApi(deleteModal.id)

      await fetchUsers()

      showToast('Đã xóa tài khoản!', 'success')

      setDeleteModal(null)

    } catch {

      showToast('Xóa tài khoản thất bại', 'error')

    } finally {

      setLoading(false)

    }
  }

  /* TABLE */

  const columns = [

    {
      key: 'name',
      label: 'Người dùng',
      render: (_: unknown, row: User) => (
        <div className="flex items-center gap-3">

          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
            {row.name.charAt(0)}
          </div>

          <div>
            <p className="font-medium text-slate-900 text-sm">{row.name}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>

        </div>
      )
    },

    {
      key: 'role',
      label: 'Vai trò',
      render: (_: unknown, row: User) => roleBadge(row.role)
    },

    {
      key: 'departmentId',
      label: 'Khoa',
      render: (_: unknown, row: User) => (
        <span className="text-sm text-slate-600">
          {getDeptName(row.departmentId)}
        </span>
      )
    },

    {
      key: 'studentId',
      label: 'Mã SV/GV',
      render: (_: unknown, row: User) => (
        <span className="text-xs font-mono text-slate-500">
          {row.studentId ?? row.lecturerId ?? '—'}
        </span>
      )
    },

    {
      key: 'status',
      label: 'Trạng thái',
      render: (_: unknown, row: User) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'error'} dot>
          {row.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu'}
        </Badge>
      )
    },

    {
      key: 'actions',
      label: 'Thao tác',
      render: (_: unknown, row: User) => (

        <div className="flex items-center gap-2">

          <Button
            variant="ghost"
            size="sm"
            icon={<PencilIcon className="w-3.5 h-3.5" />}
            onClick={() => openEdit(row)}
          >
            Sửa
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<TrashIcon className="w-3.5 h-3.5" />}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => setDeleteModal(row)}
          >
            Xóa
          </Button>

        </div>

      )
    }

  ]

  return (

    <Layout title="Quản lý Tài khoản">

      <div className="space-y-6 max-w-[1400px] mx-auto">

        {/* HEADER */}

        <div className="flex items-center justify-between">

          <Button
            variant="primary"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={openAdd}
          >
            Thêm tài khoản
          </Button>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <Card>
            <p className="text-xs text-slate-500">Tổng</p>
            <p className="text-xl font-bold text-slate-900">{stats.total}</p>
          </Card>

          <Card>
            <p className="text-xs text-slate-500">Admin</p>
            <p className="text-xl font-bold text-slate-900">{stats.admins}</p>
          </Card>

          <Card>
            <p className="text-xs text-slate-500">Giảng viên</p>
            <p className="text-xl font-bold text-slate-900">{stats.lecturers}</p>
          </Card>

          <Card>
            <p className="text-xs text-slate-500">Sinh viên</p>
            <p className="text-xl font-bold text-slate-900">{stats.students}</p>
          </Card>

        </div>

        {/* TABS */}

        <div className="flex gap-2">

          {(['ALL','ADMIN','LECTURER','STUDENT'] as const).map(tab => (

            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setPage(1)
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition
              ${
                activeTab === tab
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL'
                ? 'Tất cả'
                : tab === 'ADMIN'
                ? 'Admin'
                : tab === 'LECTURER'
                ? 'Giảng viên'
                : 'Sinh viên'}
            </button>

          ))}

        </div>

        {/* SEARCH */}

        <Card>

          <Input
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            icon={<SearchIcon className="w-4 h-4" />}
          />

        </Card>

        {/* TABLE */}

        <Card padding={false}>

          <Table
            columns={columns as Parameters<typeof Table>[0]['columns']}
            data={paginated as Record<string, unknown>[]}
            emptyMessage="Không tìm thấy tài khoản"
            keyExtractor={(row) => (row as User).id}
          />

          {totalPages > 1 && (

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
            />

          )}

        </Card>

      </div>

      {/* MODALS giữ nguyên */}

    </Layout>
  )
}