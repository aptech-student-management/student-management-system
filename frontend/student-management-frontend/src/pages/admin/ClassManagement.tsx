import React, { useEffect, useMemo, useState } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  UsersIcon,
  UserMinusIcon,
  UserPlusIcon,
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

import type { Class, Department, User } from '../../types'

import {
  createClassApi,
  deleteClassApi,
  getClassesApi,
  updateClassApi,
  addStudentToClassApi,
  removeStudentFromClassApi,
} from '../../services/classService'

import { getDepartmentsApi } from '../../services/departmentService'
import { getStudentsApi } from '../../services/userService'

const PAGE_SIZE = 8

export function ClassManagement() {
  const { showToast } = useToast()

  const [classList, setClassList] = useState<Class[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [students, setStudents] = useState<User[]>([]) // ← từ DB

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState<Class | null>(null)
  const [editing, setEditing] = useState<Class | null>(null)

  // Student Management Modals
  const [viewStudentsModal, setViewStudentsModal] = useState<Class | null>(null)
  const [addStudentModal, setAddStudentModal] = useState<Class | null>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [addStudentSearch, setAddStudentSearch] = useState('')
  const [loadingAction, setLoadingAction] = useState(false)

  const [form, setForm] = useState({
    name: '',
    code: '',
    departmentId: '',
    year: new Date().getFullYear().toString(),
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const refreshClassAndStudentData = async () => {
    const [classesData, studentsData] = await Promise.all([
      getClassesApi(),
      getStudentsApi(),
    ])
    setClassList(classesData)
    setStudents(studentsData)
    return classesData
  }

  // Fetch dữ liệu từ DB
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [classesData, departmentsData, studentsData] = await Promise.all([
          getClassesApi(),
          getDepartmentsApi(),
          getStudentsApi(),
        ])
        setClassList(classesData)
        setDepartments(departmentsData)
        setStudents(studentsData)
      } catch (error) {
        console.error(error)
        showToast('Không thể tải dữ liệu từ server', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filtered = useMemo(() => {
    let result = classList
    if (search)
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()),
      )
    if (filterDept) result = result.filter((c) => c.departmentId === filterDept)
    return result
  }, [classList, search, filterDept])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const getDeptName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? '—'

  // Danh sách HS trong lớp đang xem
  const classStudents = useMemo(() => {
    if (!viewStudentsModal) return []
    return students.filter((s) => s.classId === viewStudentsModal.id)
  }, [students, viewStudentsModal])

  const filteredClassStudents = useMemo(() => {
    if (!studentSearch) return classStudents
    return classStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(studentSearch.toLowerCase()),
    )
  }, [classStudents, studentSearch])

  // Danh sách HS có thể thêm vào lớp này (chưa thuộc lớp nào)
  const availableStudents = useMemo(() => {
    if (!addStudentModal) return []
    return students.filter((s) => !s.classId)
  }, [students, addStudentModal])

  const filteredAvailableStudents = useMemo(() => {
    if (!addStudentSearch) return availableStudents
    return availableStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(addStudentSearch.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(addStudentSearch.toLowerCase()),
    )
  }, [availableStudents, addStudentSearch])

  const handleRemoveStudent = async (student: User) => {
    if (!viewStudentsModal) return

    setLoadingAction(true)
    try {
      const classId = viewStudentsModal.id
      await removeStudentFromClassApi(classId, Number(student.id))
      const updatedClasses = await refreshClassAndStudentData()
      const refreshedClass =
        updatedClasses.find((cls) => cls.id === classId) ?? null
      setViewStudentsModal(refreshedClass)

      showToast(`Đã loại ${student.name} khỏi lớp`, 'success')
    } catch (error) {
      showToast('Loại sinh viên thất bại', 'error')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleAddStudent = async (student: User) => {
    if (!addStudentModal) return

    setLoadingAction(true)
    try {
      const classId = addStudentModal.id
      await addStudentToClassApi(classId, Number(student.id))
      const updatedClasses = await refreshClassAndStudentData()
      const refreshedClass =
        updatedClasses.find((cls) => cls.id === classId) ?? null
      setAddStudentModal(null)
      setViewStudentsModal(refreshedClass)

      showToast(`Đã thêm ${student.name} vào lớp`, 'success')
    } catch (error) {
      showToast('Thêm sinh viên thất bại', 'error')
    } finally {
      setLoadingAction(false)
    }
  }

  const openAdd = () => {
    setEditing(null)
    setForm({
      name: '',
      code: '',
      departmentId: '',
      year: new Date().getFullYear().toString(),
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
      year: cls.year.toString(),
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
          studentCount: editing.studentCount,
        })
        showToast('Cập nhật lớp thành công!', 'success')
      } else {
        await createClassApi({
          id: form.code,
          name: form.name,
          code: form.code,
          departmentId: form.departmentId,
          year: parseInt(form.year),
          studentCount: 0,
        })
        showToast('Thêm lớp mới thành công!', 'success')
      }
      const updatedClasses = await getClassesApi()
      setClassList(updatedClasses)
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
      const updatedClasses = await getClassesApi()
      setClassList(updatedClasses)
      showToast('Đã xóa lớp thành công!', 'success')
      setDeleteModal(null)
    } catch {
      showToast('Xóa lớp thất bại', 'error')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Tên lớp',
      render: (_: unknown, row: Class) => (
        <span className="font-medium text-slate-900">{row.name}</span>
      ),
    },
    {
      key: 'code',
      label: 'Mã lớp',
      render: (_: unknown, row: Class) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded font-semibold text-slate-700">
          {row.code}
        </span>
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
        <span className="text-sm">{row.year}</span>
      ),
    },
    {
      key: 'studentCount',
      label: 'Số SV',
      render: (_: unknown, row: Class) => (
        <span className="font-semibold text-slate-800">
          {row.studentCount}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_: unknown, row: Class) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<UsersIcon className="w-3.5 h-3.5" />}
            onClick={() => {
              setViewStudentsModal(row)
              setStudentSearch('')
            }}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            Sinh viên
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
      key: 'studentId',
      label: 'MSSV',
      render: (_: unknown, row: User) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded font-semibold text-slate-700">
          {row.studentId || '—'}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Họ và tên',
      render: (_: unknown, row: User) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
            {row.name.charAt(0)}
          </div>
          <span className="font-medium text-slate-900 text-sm">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (_: unknown, row: User) => (
        <span className="text-sm text-slate-500">{row.email}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_: unknown, row: User) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<UserMinusIcon className="w-3.5 h-3.5" />}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={() => handleRemoveStudent(row)}
          disabled={loadingAction}
        >
          Loại
        </Button>
      ),
    },
  ]

  const addStudentColumns = [
    {
      key: 'studentId',
      label: 'MSSV',
      render: (_: unknown, row: User) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded font-semibold text-slate-700">
          {row.studentId || '—'}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Họ và tên',
      render: (_: unknown, row: User) => (
        <span className="font-medium text-slate-900 text-sm">{row.name}</span>
      ),
    },
    {
      key: 'classId',
      label: 'Lớp hiện tại',
      render: (_: unknown, row: User) => (
        <span className="text-sm text-slate-500">
          {row.classId
            ? classList.find((c) => c.id === row.classId)?.name || '—'
            : 'Chưa có lớp'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_: unknown, row: User) => (
        <Button
          variant="outline"
          size="sm"
          icon={<UserPlusIcon className="w-3.5 h-3.5" />}
          onClick={() => handleAddStudent(row)}
          disabled={loadingAction}
        >
          Thêm
        </Button>
      ),
    },
  ]

  return (
    <Layout title="Quản lý Lớp học">
      <div className="space-y-4">
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
            columns={columns}
            data={paginated}
            emptyMessage="Không tìm thấy lớp nào"
            keyExtractor={(row) => row.id}
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

      {/* Add/Edit Class Modal */}
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

      {/* Delete Class Modal */}
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
        isOpen={!!viewStudentsModal}
        onClose={() => setViewStudentsModal(null)}
        title={`Danh sách sinh viên - ${viewStudentsModal?.name}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Tìm MSSV, họ tên..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                icon={<SearchIcon className="w-4 h-4" />}
              />
            </div>
            <Button
              variant="primary"
              icon={<UserPlusIcon className="w-4 h-4" />}
              onClick={() => {
                setAddStudentModal(viewStudentsModal)
                setAddStudentSearch('')
              }}
            >
              Thêm sinh viên
            </Button>
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto">
            <Table
              columns={studentColumns}
              data={filteredClassStudents}
              emptyMessage="Lớp chưa có sinh viên nào"
              keyExtractor={(row) => row.id}
            />
          </div>
        </div>
      </Modal>

      {/* Add Student Modal */}
      <Modal
        isOpen={!!addStudentModal}
        onClose={() => setAddStudentModal(null)}
        title={`Thêm sinh viên vào lớp - ${addStudentModal?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="max-w-sm">
            <Input
              placeholder="Tìm MSSV, họ tên..."
              value={addStudentSearch}
              onChange={(e) => setAddStudentSearch(e.target.value)}
              icon={<SearchIcon className="w-4 h-4" />}
            />
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
            <Table
              columns={addStudentColumns}
              data={filteredAvailableStudents}
              emptyMessage="Không tìm thấy sinh viên phù hợp"
              keyExtractor={(row) => row.id}
            />
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
