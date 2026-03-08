import React, { useEffect, useMemo, useState } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  BookOpenIcon,
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
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../contexts/ToastContext'

import type { Department, Subject } from '../../types'

import {
  createSubjectApi,
  deleteSubjectApi,
  getSubjectsApi,
  updateSubjectApi
} from '../../services/subjectService'

import { getDepartmentsApi } from '../../services/departmentService'

const PAGE_SIZE = 8

export function SubjectManagement() {

  const { showToast } = useToast()

  const [subjectList, setSubjectList] = useState<Subject[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [sortCredits, setSortCredits] = useState<'asc' | 'desc' | ''>('')

  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState<Subject | null>(null)
  const [editing, setEditing] = useState<Subject | null>(null)

  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    code: '',
    credits: '3',
    departmentId: '',
    description: ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  /* FETCH DATA */

  const fetchSubjects = async () => {
    try {
      const data = await getSubjectsApi()
      setSubjectList(data)
    } catch {
      showToast('Không thể tải danh sách môn học', 'error')
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
    fetchSubjects()
    fetchDepartments()
  }, [])

  /* FILTER */

  const filtered = useMemo(() => {

    let result = subjectList

    if (search)
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.code.toLowerCase().includes(search.toLowerCase())
      )

    if (filterDept)
      result = result.filter((s) => s.departmentId === filterDept)

    if (sortCredits === 'asc')
      result = [...result].sort((a, b) => a.credits - b.credits)

    if (sortCredits === 'desc')
      result = [...result].sort((a, b) => b.credits - a.credits)

    return result

  }, [subjectList, search, filterDept, sortCredits])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const stats = useMemo(() => {
    return {
      totalSubjects: subjectList.length,
      totalCredits: subjectList.reduce((s, c) => s + c.credits, 0)
    }
  }, [subjectList])

  const getDeptName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? '—'

  /* CREDIT BADGE */

  const creditBadge = (credits: number) => {

    const variant =
      credits >= 4
        ? 'purple'
        : credits === 3
        ? 'info'
        : 'neutral'

    return (
      <Badge variant={variant as 'info' | 'neutral' | 'purple'}>
        {credits} TC
      </Badge>
    )
  }

  /* MODAL */

  const openAdd = () => {
    setEditing(null)
    setForm({
      name: '',
      code: '',
      credits: '3',
      departmentId: '',
      description: ''
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (s: Subject) => {
    setEditing(s)

    setForm({
      name: s.name,
      code: s.code,
      credits: s.credits.toString(),
      departmentId: s.departmentId,
      description: s.description ?? ''
    })

    setFormErrors({})
    setModalOpen(true)
  }

  const validate = () => {

    const errs: Record<string, string> = {}

    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên môn'
    if (!form.code.trim()) errs.code = 'Vui lòng nhập mã môn'
    if (!form.departmentId) errs.departmentId = 'Vui lòng chọn khoa'

    const cr = parseInt(form.credits)

    if (isNaN(cr) || cr < 1 || cr > 6)
      errs.credits = 'Số tín chỉ từ 1-6'

    setFormErrors(errs)

    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {

    if (!validate()) return

    setLoading(true)

    try {

      if (editing) {

        await updateSubjectApi(editing.id, {
          name: form.name,
          code: form.code,
          credits: parseInt(form.credits),
          departmentId: form.departmentId,
          description: form.description || undefined
        })

        showToast('Cập nhật môn học thành công!', 'success')

      } else {

        await createSubjectApi({
          name: form.name,
          code: form.code,
          credits: parseInt(form.credits),
          departmentId: form.departmentId,
          description: form.description || undefined
        })

        showToast('Thêm môn học thành công!', 'success')

      }

      await fetchSubjects()
      setModalOpen(false)

    } catch {

      showToast('Lưu môn học thất bại', 'error')

    } finally {

      setLoading(false)

    }
  }

  const handleDelete = async () => {

    if (!deleteModal) return

    setLoading(true)

    try {

      await deleteSubjectApi(deleteModal.id)
      await fetchSubjects()

      showToast('Đã xóa môn học!', 'success')

      setDeleteModal(null)

    } catch {

      showToast('Xóa môn học thất bại', 'error')

    } finally {

      setLoading(false)

    }
  }

  /* TABLE */

  const columns = [

    {
      key: 'name',
      label: 'Môn học',
      render: (_: unknown, row: Subject) => (
        <div className="flex items-center gap-3">

          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <BookOpenIcon className="w-4 h-4 text-blue-600" />
          </div>

          <div>
            <p className="font-medium text-slate-900 text-sm">
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
      label: 'Mã môn',
      render: (_: unknown, row: Subject) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded font-semibold text-slate-700">
          {row.code}
        </span>
      )
    },

    {
      key: 'credits',
      label: 'Tín chỉ',
      render: (_: unknown, row: Subject) =>
        creditBadge(row.credits)
    },

    {
      key: 'departmentId',
      label: 'Khoa',
      render: (_: unknown, row: Subject) => (
        <span className="flex items-center gap-1 text-sm text-slate-700">
          <BuildingIcon className="w-3.5 h-3.5 text-slate-400" />
          {getDeptName(row.departmentId)}
        </span>
      )
    },

    {
      key: 'actions',
      label: 'Thao tác',
      render: (_: unknown, row: Subject) => (
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

    <Layout title="Quản lý Môn học">

      <div className="space-y-6 max-w-[1300px] mx-auto">

        {/* HEADER */}

        <div className="flex items-center justify-between">

          <Button
            variant="primary"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={openAdd}
          >
            Thêm môn
          </Button>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <Card>
            <p className="text-xs text-slate-500">Tổng môn học</p>
            <p className="text-xl font-bold text-slate-900">
              {stats.totalSubjects}
            </p>
          </Card>

          <Card>
            <p className="text-xs text-slate-500">Tổng tín chỉ</p>
            <p className="text-xl font-bold text-slate-900">
              {stats.totalCredits}
            </p>
          </Card>

        </div>

        {/* FILTER */}

        <Card>

          <div className="flex flex-wrap items-center gap-3">

            <div className="flex-1 min-w-[200px] max-w-sm">
              <Input
                placeholder="Tìm kiếm môn học..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                icon={<SearchIcon className="w-4 h-4" />}
              />
            </div>

            <div className="w-44">
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

            <div className="w-40">
              <Select
                options={[
                  { value: 'asc', label: 'TC: Tăng dần' },
                  { value: 'desc', label: 'TC: Giảm dần' }
                ]}
                value={sortCredits}
                onChange={(e) =>
                  setSortCredits(e.target.value as 'asc' | 'desc' | '')
                }
                placeholder="Sắp xếp TC"
              />
            </div>

          </div>

        </Card>

        {/* TABLE */}

        <Card padding={false}>

          <Table
            columns={columns as Parameters<typeof Table>[0]['columns']}
            data={paginated as Record<string, unknown>[]}
            emptyMessage="Không tìm thấy môn học nào"
            keyExtractor={(row) => (row as Subject).id}
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

      {/* Modal thêm / sửa */}
      {/* Modal xóa */}
      {/* (giữ nguyên code modal bạn đã có) */}

    </Layout>

  )
}