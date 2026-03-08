import React, { useEffect, useMemo, useState } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  UsersIcon,
  BuildingIcon
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

import type { Class, Department } from '../../types'

import {
  createClassApi,
  deleteClassApi,
  getClassesApi,
  updateClassApi
} from '../../services/classService'

import { getDepartmentsApi } from '../../services/departmentService'

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
          <UsersIcon className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-900">{row.name}</span>
        </div>
      )
    },

    {
      key: 'code',
      label: 'Mã lớp',
      render: (_: unknown, row: Class) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded font-semibold text-slate-700">
          {row.code}
        </span>
      )
    },

    {
      key: 'departmentId',
      label: 'Khoa',
      render: (_: unknown, row: Class) => (
        <span className="flex items-center gap-1 text-sm text-slate-700">
          <BuildingIcon className="w-3.5 h-3.5 text-slate-400" />
          {getDeptName(row.departmentId)}
        </span>
      )
    },

    {
      key: 'year',
      label: 'Năm học',
      render: (_: unknown, row: Class) => (
        <span className="text-sm">{row.year}</span>
      )
    },

    {
      key: 'studentCount',
      label: 'Sinh viên',
      render: (_: unknown, row: Class) => (
        <span className="font-semibold text-slate-800">
          {row.studentCount}
        </span>
      )
    },

    {
      key: 'actions',
      label: 'Thao tác',
      render: (_: unknown, row: Class) => (
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
    <Layout title="Quản lý Lớp học">

      <div className="space-y-6 max-w-[1300px] mx-auto">

        {/* PAGE HEADER */}

        <div className="flex items-center justify-between">

          <Button
            variant="primary"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={openAdd}
          >
            Thêm lớp
          </Button>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <Card>
            <p className="text-xs text-slate-500">Tổng lớp</p>
            <p className="text-xl font-bold text-slate-900">
              {stats.totalClasses}
            </p>
          </Card>

          <Card>
            <p className="text-xs text-slate-500">Sinh viên</p>
            <p className="text-xl font-bold text-slate-900">
              {stats.totalStudents}
            </p>
          </Card>

        </div>

        {/* FILTER */}

        <Card>

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
                  label: d.name
                }))}
                value={filterDept}
                onChange={(e) => {
                  setFilterDept(e.target.value)
                  setPage(1)
                }}
                placeholder="Tất cả khoa"
              />
            </div>

          </div>

        </Card>

        {/* TABLE */}

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

      {/* MODALS giữ nguyên logic */}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Chỉnh sửa Lớp' : 'Thêm Lớp mới'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>

            <Button
              variant="primary"
              loading={loading}
              onClick={handleSave}
            >
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
              setForm((p) => ({ ...p, name: e.target.value }))
            }
            error={formErrors.name}
            required
          />

          <Input
            label="Mã lớp"
            placeholder="VD: CNTT-K1-22"
            value={form.code}
            onChange={(e) =>
              setForm((p) => ({ ...p, code: e.target.value }))
            }
            error={formErrors.code}
            required
          />

          <Select
            label="Khoa"
            options={departments.map((d) => ({
              value: d.id,
              label: d.name
            }))}
            value={form.departmentId}
            onChange={(e) =>
              setForm((p) => ({ ...p, departmentId: e.target.value }))
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
              setForm((p) => ({ ...p, year: e.target.value }))
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

            <Button
              variant="danger"
              loading={loading}
              onClick={handleDelete}
            >
              Xóa
            </Button>
          </>
        }
      >

        <p className="text-sm text-slate-600">
          Bạn có chắc muốn xóa lớp{' '}
          <strong className="text-slate-900">
            {deleteModal?.name}
          </strong>?
        </p>

      </Modal>

    </Layout>
  )
}