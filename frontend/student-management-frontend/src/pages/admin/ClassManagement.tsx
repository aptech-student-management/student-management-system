import React, { useEffect, useMemo, useState } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  UsersIcon,
  EyeIcon,
  GraduationCapIcon,
  MailIcon,
  PhoneIcon,
} from 'lucide-react'

import { Layout } from '../../components/layout/Layout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import { useToast } from '../../contexts/ToastContext'
import { Badge } from '../../components/ui/Badge'
import { StatCard } from '../../components/ui/StatCard'

import type { Class, Department, User } from '../../types'

import {
  createClassApi,
  deleteClassApi,
  getClassesApi,
  updateClassApi
} from '../../services/classService'

import { getDepartmentsApi } from '../../services/departmentService'
import { users } from '../../data/mockData'

const PAGE_SIZE = 8

export function ClassManagement() {
  const { showToast } = useToast()

  const [classList, setClassList] = useState<Class[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState<Class | null>(null)
  const [editing, setEditing] = useState<Class | null>(null)

  const [loading, setLoading] = useState(false)

  const [viewStudentsClass, setViewStudentsClass] = useState<Class | null>(null)
  const [studentSearch, setStudentSearch] = useState('')

  const [form, setForm] = useState({
    name: '',
    code: '',
    departmentId: '',
    year: new Date().getFullYear().toString()
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  /* FETCH DATA */

  const fetchClasses = async () => {
    try {
      const data = await getClassesApi()
      setClassList(data)
    } catch {
      showToast('Không thể tải danh sách lớp', 'error')
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
    fetchClasses()
    fetchDepartments()
  }, [])

   // Get actual students for a class from users data
  const getStudentsByClass = (classId: string): User[] => {
    return users.filter((u) => u.role === 'STUDENT' && u.classId === classId)
  }

  // Students for the currently viewed class
  const viewedStudents = useMemo(() => {
    if (!viewStudentsClass) return []
    let students = getStudentsByClass(viewStudentsClass.id)
    if (studentSearch) {
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
          (s.studentId ?? '').toLowerCase().includes(studentSearch.toLowerCase()) ||
          s.email.toLowerCase().includes(studentSearch.toLowerCase()),
      )
    }
    return students
  }, [viewStudentsClass, studentSearch])

  // Stats
  const totalStudents = useMemo(
    () => users.filter((u) => u.role === 'STUDENT').length,
    [],
  )


  /* FILTER */

  const filtered = useMemo(() => {
    let result = classList

    if (search)
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )

    if (filterDept)
      result = result.filter((c) => c.departmentId === filterDept)

    return result
  }, [classList, search, filterDept])

  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const stats = useMemo(() => {
    return {
      totalClasses: classList.length,
      totalStudents: classList.reduce((s, c) => s + c.studentCount, 0)
    }
  }, [classList])

  const getDeptName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? '—'

  /* MODAL */

  const openAdd = () => {
    setEditing(null)
    setForm({
      name: '',
      code: '',
      departmentId: '',
      year: new Date().getFullYear().toString()
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (cls: Class) => {
    setEditing(cls)

    setForm({
      name: cls.name,
      code: cls.code,
      departmentId: cls.departmentId,
      year: cls.year.toString()
    })

    setFormErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errs: Record<string, string> = {}

    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên lớp'
    if (!form.code.trim()) errs.code = 'Vui lòng nhập mã lớp'
    if (!form.departmentId) errs.departmentId = 'Vui lòng chọn khoa'

    setFormErrors(errs)

    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    setLoading(true)

    try {
      if (editing) {
        await updateClassApi(editing.id, {
          name: form.name,
          code: form.code,
          departmentId: form.departmentId,
          year: parseInt(form.year),
          studentCount: editing.studentCount
        })

        showToast('Cập nhật lớp thành công!', 'success')
      } else {
        await createClassApi({
          id: form.code,
          name: form.name,
          code: form.code,
          departmentId: form.departmentId,
          year: parseInt(form.year),
          studentCount: 0
        })

        showToast('Thêm lớp mới thành công!', 'success')
      }

      await fetchClasses()
      setModalOpen(false)
    } catch {
      showToast('Lưu lớp thất bại', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal) return

    setLoading(true)

    try {
      await deleteClassApi(deleteModal.id)
      await fetchClasses()

      showToast('Đã xóa lớp thành công!', 'success')

      setDeleteModal(null)
    } catch {
      showToast('Xóa lớp thất bại', 'error')
    } finally {
      setLoading(false)
    }
  }

  /* TABLE */

  const columns = [
    {
      key: 'name',
      label: 'Tên lớp',
      render: (_: unknown, row: Class) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <GraduationCapIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500 font-mono">{row.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'departmentId',
      label: 'Khoa',
      render: (_: unknown, row: Class) => (
        <span className="text-sm text-slate-600">
          {getDeptName(row.departmentId)}
        </span>
      ),
    },
    {
      key: 'year',
      label: 'Năm học',
      render: (_: unknown, row: Class) => (
        <Badge variant="neutral">{row.year}</Badge>
      ),
    },
    {
      key: 'studentCount',
      label: 'Số sinh viên',
      render: (_: unknown, row: Class) => {
        const actualCount = getStudentsByClass(row.id).length
        return (
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-800">
              {actualCount > 0 ? actualCount : row.studentCount}
            </span>
          </div>
        )
      },
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_: unknown, row: Class) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<EyeIcon className="w-3.5 h-3.5" />}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            onClick={() => {
              setViewStudentsClass(row)
              setStudentSearch('')
            }}
          >
            Xem SV
          </Button>
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
      ),
    },
  ]
  const studentColumns = [
    {
      key: 'name',
      label: 'Sinh viên',
      render: (_: unknown, row: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-900 text-sm">{row.name}</p>
            <p className="text-xs text-slate-500 font-mono">
              {row.studentId ?? '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (_: unknown, row: User) => (
        <span className="text-sm text-slate-600">{row.email}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Điện thoại',
      render: (_: unknown, row: User) => (
        <span className="text-sm text-slate-600">{row.phone ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (_: unknown, row: User) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'error'} dot>
          {row.status === 'ACTIVE' ? 'Đang học' : 'Nghỉ học'}
        </Badge>
      ),
    },
  ]
  return (
    <Layout title="Quản lý Lớp học">
      <div className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Tổng lớp học"
            value={classList.length}
            icon={<GraduationCapIcon className="w-5 h-5" />}
            color="blue"
            subtitle={`${departments.length} khoa`}
          />
          <StatCard
            title="Tổng sinh viên"
            value={totalStudents}
            icon={<UsersIcon className="w-5 h-5" />}
            color="emerald"
            subtitle="Tất cả các lớp"
          />
          <StatCard
            title="TB SV/Lớp"
            value={
              classList.length > 0
                ? Math.round(totalStudents / classList.length)
                : 0
            }
            icon={<UsersIcon className="w-5 h-5" />}
            color="amber"
            subtitle="Trung bình"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <Input
              placeholder="Tìm kiếm lớp..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              icon={<SearchIcon className="w-4 h-4" />}
            />
          </div>
          <div className="w-48">
            <Select
              options={departments.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
              value={filterDept}
              onChange={(e) => {
                setFilterDept(e.target.value)
                setPage(1)
              }}
              placeholder="Tất cả khoa"
            />
          </div>
          <Button
            variant="primary"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={openAdd}
          >
            Thêm lớp
          </Button>
        </div>

        <Card padding={false}>
          <Table
            columns={columns as Parameters<typeof Table>[0]['columns']}
            data={paginated as Record<string, unknown>[]}
            emptyMessage="Không tìm thấy lớp nào"
            keyExtractor={(row) => (row as Class).id}
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Chỉnh sửa Lớp' : 'Thêm Lớp mới'}
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
            label="Tên lớp"
            placeholder="VD: CNTT K1 2022"
            value={form.name}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                name: e.target.value,
              }))
            }
            error={formErrors.name}
            required
          />
          <Input
            label="Mã lớp"
            placeholder="VD: CNTT-K1-22"
            value={form.code}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                code: e.target.value,
              }))
            }
            error={formErrors.code}
            required
          />
          <Select
            label="Khoa"
            options={departments.map((d) => ({
              value: d.id,
              label: d.name,
            }))}
            value={form.departmentId}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                departmentId: e.target.value,
              }))
            }
            error={formErrors.departmentId}
            placeholder="Chọn khoa"
            required
          />
          <Input
            label="Năm học"
            type="number"
            value={form.year}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                year: e.target.value,
              }))
            }
            required
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
          Bạn có chắc muốn xóa lớp{' '}
          <strong className="text-slate-900">{deleteModal?.name}</strong>?
        </p>
      </Modal>

      {/* View Students Modal */}
      <Modal
        isOpen={!!viewStudentsClass}
        onClose={() => setViewStudentsClass(null)}
        title={`Danh sách sinh viên — ${viewStudentsClass?.name ?? ''}`}
        size="xl"
      >
        {viewStudentsClass && (
          <div className="space-y-4">
            {/* Class info header */}
            <div className="flex items-center justify-between bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <GraduationCapIcon className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">
                    {viewStudentsClass.name}
                  </p>
                  <p className="text-xs text-blue-700">
                    {getDeptName(viewStudentsClass.departmentId)} · Khóa{' '}
                    {viewStudentsClass.year}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900">
                  {viewedStudents.length}
                </p>
                <p className="text-xs text-blue-600">sinh viên</p>
              </div>
            </div>

            {/* Search */}
            <Input
              placeholder="Tìm theo tên, mã SV, email..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              icon={<SearchIcon className="w-4 h-4" />}
            />

            {/* Student list */}
            {viewedStudents.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <UsersIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {studentSearch
                    ? 'Không tìm thấy sinh viên phù hợp'
                    : 'Chưa có sinh viên nào trong lớp này'}
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table
                  columns={
                    studentColumns as Parameters<typeof Table>[0]['columns']
                  }
                  data={viewedStudents as Record<string, unknown>[]}
                  emptyMessage="Không có sinh viên"
                  keyExtractor={(row) => (row as User).id}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  )
}