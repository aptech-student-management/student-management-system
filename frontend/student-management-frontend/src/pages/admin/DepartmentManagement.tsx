import React, { useEffect, useMemo, useState } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  BuildingIcon,
  UsersIcon,
  BookOpenIcon
} from 'lucide-react'

import { Layout } from '../../components/layout/Layout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Table } from '../../components/ui/Table'
import { useToast } from '../../contexts/ToastContext'
import type { Department, User } from '../../types'

import {
  createDepartmentApi,
  deleteDepartmentApi,
  getDepartmentsApi,
  updateDepartmentApi
} from '../../services/departmentService'
import { getAdminUsersApi } from '../../services/adminUserService'

export function DepartmentManagement() {
  const { showToast } = useToast()

  const [depts, setDepts] = useState<Department[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState<Department | null>(null)
  const [editing, setEditing] = useState<Department | null>(null)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])

  const [form, setForm] = useState({
    name: '',
    code: '',
    headLecturerId: '',
    description: ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const lecturers = users.filter((u) => u.role === 'LECTURER')

  const fetchDepartments = async () => {
    try {
      const data = await getDepartmentsApi()
      setDepts(data)
    } catch {
      showToast('Không thể tải danh sách khoa', 'error')
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await fetchDepartments()
      try {
        const userData = await getAdminUsersApi()
        setUsers(userData)
      } catch {
        showToast('Không thể tải danh sách giảng viên', 'error')
      }
    }

    void fetchData()
  }, [showToast])

  const filtered = useMemo(
    () =>
      depts.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.code.toLowerCase().includes(search.toLowerCase())
      ),
    [depts, search]
  )

  const stats = useMemo(() => {
    return {
      totalDept: depts.length,
      totalStudents: depts.reduce((s, d) => s + Number(d.studentCount ?? 0), 0),
      totalSubjects: depts.reduce((s, d) => s + Number(d.subjectCount ?? 0), 0)
    }
  }, [depts])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', code: '', headLecturerId: '', description: '' })
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (dept: Department) => {
    setEditing(dept)
    setForm({
      name: dept.name,
      code: dept.code,
      headLecturerId: dept.headLecturerId ?? '',
      description: dept.description ?? ''
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errs: Record<string, string> = {}

    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên khoa'
    if (!form.code.trim()) errs.code = 'Vui lòng nhập mã khoa'

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    setLoading(true)

    try {
      if (editing) {
        await updateDepartmentApi(editing.id, {
          name: form.name,
          code: form.code,
          headLecturerId: form.headLecturerId || undefined,
          description: form.description || undefined
        })
        showToast('Cập nhật khoa thành công!', 'success')
      } else {
        await createDepartmentApi({
          name: form.name,
          code: form.code,
          headLecturerId: form.headLecturerId || undefined,
          description: form.description || undefined
        })
        showToast('Thêm khoa mới thành công!', 'success')
      }

      await fetchDepartments()
      setModalOpen(false)
    } catch {
      showToast('Lưu khoa thất bại', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal) return

    setLoading(true)

    try {
      await deleteDepartmentApi(deleteModal.id)
      await fetchDepartments()

      showToast('Đã xóa khoa thành công!', 'success')

      setDeleteModal(null)
    } catch {
      showToast('Xóa khoa thất bại', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getLecturerName = (id?: string) => {
    if (!id) return '—'
    return lecturers.find((l) => l.id === id)?.name ?? '—'
  }

  const columns = [
    {
      key: 'name',
      label: 'Khoa',
      render: (_: unknown, row: Department) => (
        <div className="flex items-center gap-3">

          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <BuildingIcon className="w-4 h-4 text-blue-600" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              {row.name}
            </p>

            <p className="text-xs text-slate-500">
              {row.description}
            </p>
          </div>

        </div>
      )
    },

    {
      key: 'code',
      label: 'Mã khoa',
      render: (_: unknown, row: Department) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded font-semibold text-slate-700">
          {row.code}
        </span>
      )
    },

    {
      key: 'headLecturerId',
      label: 'Trưởng khoa',
      render: (_: unknown, row: Department) => (
        <span className="text-sm text-slate-700">
          {getLecturerName(row.headLecturerId)}
        </span>
      )
    },

    {
      key: 'studentCount',
      label: 'Sinh viên',
      render: (_: unknown, row: Department) => (
        <span className="flex items-center gap-1 text-sm font-medium text-slate-800">
          <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
          {row.studentCount}
        </span>
      )
    },

    {
      key: 'subjectCount',
      label: 'Môn học',
      render: (_: unknown, row: Department) => (
        <span className="flex items-center gap-1 text-sm font-medium text-slate-800">
          <BookOpenIcon className="w-3.5 h-3.5 text-slate-400" />
          {row.subjectCount}
        </span>
      )
    },

    {
      key: 'actions',
      label: 'Thao tác',
      render: (_: unknown, row: Department) => (
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
    <Layout title="Quản lý Khoa">

      <div className="space-y-6">

        {/* PAGE HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <Button
            variant="primary"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={openAdd}
          >
            Thêm khoa
          </Button>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <Card>
            <p className="text-xs text-slate-500">Tổng khoa</p>
            <p className="text-xl font-bold text-slate-900">{stats.totalDept}</p>
          </Card>

          <Card>
            <p className="text-xs text-slate-500">Sinh viên</p>
            <p className="text-xl font-bold text-slate-900">{stats.totalStudents}</p>
          </Card>

          <Card>
            <p className="text-xs text-slate-500">Môn học</p>
            <p className="text-xl font-bold text-slate-900">{stats.totalSubjects}</p>
          </Card>

        </div>

        {/* SEARCH */}

        <Card>

          <div className="flex items-center gap-4">

            <div className="flex-1 max-w-md">
              <Input
                placeholder="Tìm kiếm khoa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<SearchIcon className="w-4 h-4" />}
              />
            </div>

          </div>

        </Card>

        {/* TABLE */}

        <Card padding={false}>

          <Table
            columns={columns as Parameters<typeof Table>[0]['columns']}
            data={filtered as Record<string, unknown>[]}
            emptyMessage="Không tìm thấy khoa nào"
            keyExtractor={(row) => (row as Department).id}
          />

        </Card>

      </div>

      {/* MODALS giữ nguyên */}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Chỉnh sửa Khoa' : 'Thêm Khoa mới'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={loading} onClick={handleSave}>
              {editing ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </>
        }
      >

        <div className="space-y-4">

          <Input
            label="Tên khoa"
            placeholder="VD: Khoa Công nghệ Thông tin"
            value={form.name}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                name: e.target.value
              }))
            }
            error={formErrors.name}
            required
          />

          <Input
            label="Mã khoa"
            placeholder="VD: CNTT"
            value={form.code}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                code: e.target.value.toUpperCase()
              }))
            }
            error={formErrors.code}
            required
          />

          <Select
            label="Trưởng khoa"
            options={lecturers.map((l) => ({
              value: l.id,
              label: l.name
            }))}
            value={form.headLecturerId}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                headLecturerId: e.target.value
              }))
            }
            placeholder="Chọn trưởng khoa"
          />

          <Input
            label="Mô tả"
            placeholder="Mô tả ngắn về khoa"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                description: e.target.value
              }))
            }
          />

        </div>

      </Modal>

      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Xác nhận xóa"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteModal(null)}>
              Hủy
            </Button>
            <Button variant="danger" loading={loading} onClick={handleDelete}>
              Xóa
            </Button>
          </>
        }
      >

        <p className="text-sm text-slate-600">
          Bạn có chắc muốn xóa khoa{' '}
          <strong className="text-slate-900">{deleteModal?.name}</strong>? Hành
          động này không thể hoàn tác.
        </p>

      </Modal>

    </Layout>
  )
}