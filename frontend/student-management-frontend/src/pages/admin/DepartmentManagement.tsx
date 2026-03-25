import { useEffect, useMemo, useState } from 'react'
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

function useCountUp(value: number, duration = 700) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const target = Math.max(0, value)
    const start = performance.now()
    let raf = 0

    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - start) / duration, 1)
      setDisplayValue(Math.round(target * progress))

      if (progress < 1) {
        raf = requestAnimationFrame(animate)
      }
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return displayValue
}

function CountUpText({
  value,
  duration = 500
}: {
  value: number
  duration?: number
}) {
  const animatedValue = useCountUp(value, duration)
  return <>{animatedValue}</>
}

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
      setLoading(true)
      const data = await getDepartmentsApi()
      setDepts(data)
    } catch (error) {
      console.error(error)
      showToast('Không thể tải danh sách khoa', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await fetchDepartments()

      try {
        const userData = await getAdminUsersApi()
        setUsers(userData)
      } catch (error) {
        console.error(error)
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
      totalStudents: depts.reduce((s, d) => s + (d.studentCount || 0), 0),
      totalSubjects: depts.reduce((s, d) => s + (d.subjectCount || 0), 0)
    }
  }, [depts])

  const animatedTotalDept = useCountUp(stats.totalDept)
  const animatedTotalStudents = useCountUp(stats.totalStudents)
  const animatedTotalSubjects = useCountUp(stats.totalSubjects)

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

    const duplicatedCode = depts.find(
      (d) =>
        d.code.trim().toLowerCase() === form.code.trim().toLowerCase() &&
        d.id !== editing?.id
    )

    if (duplicatedCode) {
      errs.code = 'Mã khoa đã tồn tại'
    }

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    try {
      setLoading(true)

      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        headLecturerId: form.headLecturerId || null,
        description: form.description.trim()
      }

      if (editing) {
        await updateDepartmentApi(editing.id, payload)
        showToast('Cập nhật khoa thành công', 'success')
      } else {
        await createDepartmentApi(payload)
        showToast('Tạo khoa thành công', 'success')
      }

      setModalOpen(false)
      setEditing(null)
      setForm({ name: '', code: '', headLecturerId: '', description: '' })
      await fetchDepartments()
    } catch (error) {
      console.error(error)
      showToast(
        editing ? 'Không thể cập nhật khoa' : 'Không thể tạo khoa',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal) return

    try {
      setLoading(true)
      await deleteDepartmentApi(deleteModal.id)
      showToast('Xóa khoa thành công', 'success')
      setDeleteModal(null)
      await fetchDepartments()
    } catch (error) {
      console.error(error)
      showToast('Không thể xóa khoa', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getLecturerName = (id?: string | null) => {
    if (!id) return 'Chưa phân công'
    return lecturers.find((u) => u.id === id)?.fullName || 'Không xác định'
  }

  const columns = [
    {
      key: 'name',
      label: 'Tên khoa',
      render: (_: unknown, row: Department) => (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <BuildingIcon className="w-5 h-5 text-blue-600" />
          </div>

          <div>
            <p className="font-semibold text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.description}</p>
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
          {row.headLecturerName || getLecturerName(row.headLecturerId)}
        </span>
      )
    },

    {
      key: 'studentCount',
      label: 'Sinh viên',
      render: (_: unknown, row: Department) => (
        <span className="flex items-center gap-1 text-sm font-medium text-slate-800">
          <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
          <CountUpText value={row.studentCount || 0} />
        </span>
      )
    },

    {
      key: 'subjectCount',
      label: 'Môn học',
      render: (_: unknown, row: Department) => (
        <span className="flex items-center gap-1 text-sm font-medium text-slate-800">
          <BookOpenIcon className="w-3.5 h-3.5 text-slate-400" />
          <CountUpText value={row.subjectCount || 0} />
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
      <div className="space-y-6 max-w-[1300px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Button
            variant="primary"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={openAdd}
          >
            Thêm khoa
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <p className="text-xs text-slate-500">Tổng khoa</p>
            <p className="text-xl font-bold text-slate-900">
              {animatedTotalDept}
            </p>
          </Card>

          <Card>
            <p className="text-xs text-slate-500">Sinh viên</p>
            <p className="text-xl font-bold text-slate-900">
              {animatedTotalStudents}
            </p>
          </Card>

          <Card>
            <p className="text-xs text-slate-500">Môn học</p>
            <p className="text-xl font-bold text-slate-900">
              {animatedTotalSubjects}
            </p>
          </Card>
        </div>

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

        <Card>
          <Table
            data={filtered}
            columns={columns}
            loading={loading}
            emptyText="Không có khoa nào"
          />
        </Card>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? 'Cập nhật khoa' : 'Thêm khoa'}
        >
          <div className="space-y-4">
            <Input
              label="Tên khoa"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              error={formErrors.name}
              placeholder="Nhập tên khoa"
            />

            <Input
              label="Mã khoa"
              value={form.code}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, code: e.target.value }))
              }
              error={formErrors.code}
              placeholder="Ví dụ: CNTT"
            />

            <Select
              label="Trưởng khoa"
              value={form.headLecturerId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  headLecturerId: e.target.value
                }))
              }
              options={[
                { label: 'Chọn trưởng khoa', value: '' },
                ...lecturers.map((u) => ({
                  label: u.fullName,
                  value: u.id
                }))
              ]}
            />

            <Input
              label="Mô tả"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Mô tả ngắn về khoa"
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Hủy
              </Button>
              <Button variant="primary" onClick={handleSave} loading={loading}>
                {editing ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          title="Xác nhận xóa"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn xóa khoa{' '}
              <span className="font-semibold text-slate-900">
                {deleteModal?.name}
              </span>{' '}
              không?
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteModal(null)}>
                Hủy
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={loading}
              >
                Xóa
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}