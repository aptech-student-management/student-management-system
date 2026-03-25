import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  SaveIcon,
  DownloadIcon,
  LockIcon,
  UnlockIcon,
  ClipboardListIcon,
  UploadIcon
} from 'lucide-react'

import { Layout } from '../../components/layout/Layout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'

import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

import type {
  Attendance,
  CourseSection,
  Enrollment,
  Grade,
  Subject,
  User
} from '../../types'

import { getCourseSectionsApi } from '../../services/courseSectionService'
import { getSubjectsApi } from '../../services/subjectService'
import { getEnrollmentsApi } from '../../services/enrollmentService'
import { getUsersApi } from '../../services/userService'
import { getAttendanceApi } from '../../services/attendanceService'
import {
  applyGradeImportApi,
  getGradesApi,
  previewGradeImportApi,
  type GradeImportRow,
  upsertGradeApi
} from '../../services/gradeService'

interface GradeRow {
  studentId: string
  name: string
  studentCode: string
  attendanceScore: number
  midterm: number | ''
  final: number | ''
  totalScore: number | null
  letterGrade: string
  gpaPoint: number | null
}

const calculateGrade = (midterm: number, final: number, attendance: number) => {

  const totalScore =
    Math.round((0.1 * attendance + 0.3 * midterm + 0.6 * final) * 100) / 100

  let letterGrade = 'F'
  let gpaPoint = 0

  if (totalScore >= 8.5) {
    letterGrade = 'A'
    gpaPoint = 4
  } else if (totalScore >= 8.0) {
    letterGrade = 'B+'
    gpaPoint = 3.5
  } else if (totalScore >= 7.0) {
    letterGrade = 'B'
    gpaPoint = 3
  } else if (totalScore >= 6.5) {
    letterGrade = 'C+'
    gpaPoint = 2.5
  } else if (totalScore >= 5.5) {
    letterGrade = 'C'
    gpaPoint = 2
  }

  return { totalScore, letterGrade, gpaPoint }
}

export function GradeManagement() {

  const { currentUser } = useAuth()
  const { showToast } = useToast()

  const [selectedSection, setSelectedSection] = useState('')
  const [gradeRows, setGradeRows] = useState<GradeRow[]>([])
  const [saving, setSaving] = useState(false)
  const [locked, setLocked] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importRows, setImportRows] = useState<GradeImportRow[]>([])
  const [importLoading, setImportLoading] = useState(false)

  const [courseSections, setCourseSections] = useState<CourseSection[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([])

  useEffect(() => {

    const loadData = async () => {
      try {

        const [
          sectionData,
          subjectData,
          enrollmentData,
          userData,
          gradeData,
          attendanceData
        ] = await Promise.all([
          getCourseSectionsApi(),
          getSubjectsApi(),
          getEnrollmentsApi(),
          getUsersApi(),
          getGradesApi(),
          getAttendanceApi()
        ])

        setCourseSections(sectionData)
        setSubjects(subjectData)
        setEnrollments(enrollmentData)
        setUsers(userData)
        setGrades(gradeData)
        setAttendanceRecords(attendanceData)

      } catch {
        showToast('Không thể tải dữ liệu nhập điểm', 'error')
      }
    }

    void loadData()

  }, [showToast])

  const myClasses = useMemo(
    () => courseSections.filter((cs) => cs.lecturerId === currentUser?.id),
    [courseSections, currentUser]
  )

  const loadSection = useCallback((sectionId: string, gradeSource = grades) => {

    setSelectedSection(sectionId)
    setLocked(false)

    const students = enrollments
      .filter(
        (e) =>
          e.courseSectionId === sectionId &&
          e.status === 'ENROLLED'
      )
      .map((e) => users.find((u) => u.studentId === e.studentId))
      .filter(Boolean) as User[]

    const rows: GradeRow[] = students.map((student) => {

      const existing = gradeSource.find(
        (g) =>
          g.studentId === student.studentId &&
          g.courseSectionId === sectionId
      )

      const attRecords = attendanceRecords.filter(
        (a) =>
          a.studentId === student.studentId &&
          a.courseSectionId === sectionId
      )

      const present = attRecords.filter(
        (a) => a.status === 'PRESENT'
      ).length

      const late = attRecords.filter(
        (a) => a.status === 'LATE'
      ).length

      const totalSessions = Math.max(attRecords.length, 1)

      const attScore =
        existing?.attendanceScore ??
        Math.round(((present + late * 0.5) / totalSessions) * 100) / 10

      const midterm = existing?.midterm ?? ''
      const final = existing?.final ?? ''

      let totalScore: number | null = null
      let letterGrade = '—'
      let gpaPoint: number | null = null

      if (midterm !== '' && final !== '') {

        const calc = calculateGrade(
          midterm as number,
          final as number,
          attScore
        )

        totalScore = calc.totalScore
        letterGrade = calc.letterGrade
        gpaPoint = calc.gpaPoint
      }

      return {
        studentId: student.studentId ?? '',
        name: student.name,
        studentCode: student.studentId ?? '',
        attendanceScore: attScore,
        midterm,
        final,
        totalScore,
        letterGrade,
        gpaPoint
      }

    })

    setGradeRows(rows)

  }, [attendanceRecords, enrollments, grades, users])

  const updateGrade = (
    studentId: string,
    field: 'midterm' | 'final',
    value: string
  ) => {

    if (locked) return

    setGradeRows((prev) =>
      prev.map((row) => {

        if (row.studentId !== studentId) return row

        const numVal =
          value === ''
            ? ''
            : Math.min(10, Math.max(0, parseFloat(value) || 0))

        const updated = {
          ...row,
          [field]: numVal
        }

        if (updated.midterm !== '' && updated.final !== '') {

          const calc = calculateGrade(
            updated.midterm as number,
            updated.final as number,
            updated.attendanceScore
          )

          return {
            ...updated,
            totalScore: calc.totalScore,
            letterGrade: calc.letterGrade,
            gpaPoint: calc.gpaPoint
          }
        }

        return {
          ...updated,
          totalScore: null,
          letterGrade: '—',
          gpaPoint: null
        }
      })
    )
  }

  const recalculateImportRows = (rows: GradeImportRow[]) => {
    const studentIdCount = new Map<string, number>()

    rows.forEach((row) => {
      const studentId = row.studentId.trim().toLowerCase()
      if (studentId) {
        studentIdCount.set(studentId, (studentIdCount.get(studentId) ?? 0) + 1)
      }
    })

    return rows.map((row) => {
      const issues = [...row.issues.filter(
        (issue) =>
          !issue.includes('trùng trong file import') &&
          !issue.includes('phải nằm trong khoảng 0-10') &&
          !issue.includes('Thiếu mã sinh viên')
      )]

      const normalizedStudentId = row.studentId.trim().toLowerCase()

      if (!row.studentId.trim()) {
        issues.push('Thiếu mã sinh viên')
      }

      const numericFields: Array<[string, number | undefined]> = [
        ['Giữa kỳ', row.midterm],
        ['Cuối kỳ', row.finalScore],
        ['Chuyên cần', row.attendanceScore]
      ]

      numericFields.forEach(([label, value]) => {
        if (value != null && (value < 0 || value > 10)) {
          issues.push(`${label} phải nằm trong khoảng 0-10`)
        }
      })

      if (normalizedStudentId && (studentIdCount.get(normalizedStudentId) ?? 0) > 1) {
        issues.push('Mã sinh viên bị trùng trong file import')
      }

      const blockingIssues = issues.filter(
        (issue) =>
          issue.includes('Thiếu') ||
          issue.includes('không') ||
          issue.includes('Không') ||
          issue.includes('phải nằm') ||
          issue.includes('trùng trong file import')
      )

      let totalScore = row.totalScore
      let letterGrade = row.letterGrade
      let gpaPoint = row.gpaPoint

      if (row.midterm != null && row.finalScore != null) {
        const total = Math.round((0.1 * (row.attendanceScore ?? 0) + 0.3 * row.midterm + 0.6 * row.finalScore) * 100) / 100
        totalScore = total
        if (total >= 8.5) {
          letterGrade = 'A'
          gpaPoint = 4
        } else if (total >= 8.0) {
          letterGrade = 'B+'
          gpaPoint = 3.5
        } else if (total >= 7.0) {
          letterGrade = 'B'
          gpaPoint = 3
        } else if (total >= 6.5) {
          letterGrade = 'C+'
          gpaPoint = 2.5
        } else if (total >= 5.5) {
          letterGrade = 'C'
          gpaPoint = 2
        } else {
          letterGrade = 'F'
          gpaPoint = 0
        }
      }

      return {
        ...row,
        totalScore,
        letterGrade,
        gpaPoint,
        issues,
        ready: blockingIssues.length === 0
      }
    })
  }

  const openImport = () => {
    if (!selectedSection) {
      showToast('Hãy chọn lớp học phần trước khi import điểm', 'warning')
      return
    }

    setImportFile(null)
    setImportRows([])
    setImportModalOpen(true)
  }

  const handlePreviewImport = async () => {
    if (!importFile || !selectedSection) {
      showToast('Vui lòng chọn file và lớp học phần', 'warning')
      return
    }

    try {
      setImportLoading(true)
      const preview = await previewGradeImportApi(importFile, selectedSection)
      setImportRows(recalculateImportRows(preview.rows))
      showToast(`Đã đọc ${preview.totalRows} dòng điểm từ file`, 'success')
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Không thể đọc file điểm'
      showToast(message, 'error')
    } finally {
      setImportLoading(false)
    }
  }

  const updateImportRow = (
    index: number,
    field: keyof Pick<GradeImportRow, 'studentId' | 'attendanceScore' | 'midterm' | 'finalScore'>,
    value: string
  ) => {
    setImportRows((prev) =>
      recalculateImportRows(
        prev.map((row, rowIndex) => {
          if (rowIndex !== index) return row

          const numericField = field !== 'studentId'
          return {
            ...row,
            [field]:
              numericField
                ? (value === '' ? undefined : Number(value))
                : value
          }
        })
      )
    )
  }

  const handleApplyImport = async () => {
    if (!selectedSection || importRows.length === 0) {
      showToast('Chưa có dữ liệu import', 'warning')
      return
    }

    if (importRows.some((row) => !row.ready)) {
      showToast('Vui lòng sửa các dòng còn lỗi trước khi import', 'warning')
      return
    }

    try {
      setImportLoading(true)
      const result = await applyGradeImportApi({
        courseSectionId: selectedSection,
        rows: importRows
      })

      const gradeData = await getGradesApi({ courseSectionId: selectedSection })
      setGrades((prev) => {
        const nextGrades = [
          ...prev.filter((grade) => grade.courseSectionId !== selectedSection),
          ...gradeData
        ]
        loadSection(selectedSection, nextGrades)
        return nextGrades
      })
      setImportModalOpen(false)
      setImportFile(null)
      setImportRows([])
      showToast(
        `Import thành công ${result.totalCount} bản ghi điểm (${result.createdCount} mới, ${result.updatedCount} cập nhật)`,
        'success'
      )
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Import điểm thất bại'
      showToast(message, 'error')
    } finally {
      setImportLoading(false)
    }
  }

  const importReadyCount = useMemo(
    () => importRows.filter((row) => row.ready).length,
    [importRows]
  )

  const handleSave = async () => {

    if (!selectedSection) return

    try {

      setSaving(true)

      const toSave = gradeRows.filter(
        (r) => r.midterm !== '' && r.final !== ''
      )

      for (const row of toSave) {

        await upsertGradeApi({
          studentId: row.studentId,
          courseSectionId: selectedSection,
          midterm: row.midterm as number,
          finalScore: row.final as number,
          attendanceScore: row.attendanceScore,
          totalScore: row.totalScore ?? undefined,
          letterGrade:
            row.letterGrade === '—'
              ? undefined
              : row.letterGrade,
          gpaPoint: row.gpaPoint ?? undefined,
          updatedBy: currentUser?.id
        })
      }

      showToast('Lưu bảng điểm thành công!', 'success')

    } catch {

      showToast('Lưu bảng điểm thất bại', 'error')

    } finally {

      setSaving(false)

    }
  }

  return (

    <Layout title="Nhập điểm">

      <div className="space-y-6">

        <Card>

          <div className="flex flex-wrap items-end gap-4">

            <div className="flex-1 min-w-[260px]">

              <Select
                label="Lớp học phần"
                options={myClasses.map((cs) => {

                  const subj = subjects.find(
                    (s) => s.id === cs.subjectId
                  )

                  return {
                    value: cs.id,
                    label: `${subj?.name} (${cs.schedule})`
                  }
                })}
                value={selectedSection}
                onChange={(e) =>
                  loadSection(e.target.value)
                }
                placeholder="Chọn lớp học phần"
              />

            </div>

            {selectedSection && (

              <div className="flex gap-2 flex-wrap">

                <Button
                  variant="outline"
                  size="sm"
                  icon={<UploadIcon className="w-4 h-4"/>}
                  disabled={locked}
                  onClick={openImport}
                >
                  Import file
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  icon={
                    locked
                      ? <UnlockIcon className="w-4 h-4"/>
                      : <LockIcon className="w-4 h-4"/>
                  }
                  onClick={() => setLocked(!locked)}
                >
                  {locked ? 'Mở khóa' : 'Khóa điểm'}
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  icon={<SaveIcon className="w-4 h-4"/>}
                  loading={saving}
                  disabled={locked}
                  onClick={handleSave}
                >
                  Lưu tất cả
                </Button>

              </div>

            )}

          </div>

        </Card>

        {selectedSection && gradeRows.length > 0 && (

          <Card padding={false}>

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-slate-50 border-b">

                  <tr>

                    <th className="px-4 py-3 text-left text-xs text-slate-500">#</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500">Sinh viên</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500">Chuyên cần</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500">GK</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500">CK</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500">Tổng</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500">Điểm chữ</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500">GPA</th>

                  </tr>

                </thead>

                <tbody>

                  {gradeRows.map((row, idx) => (

                    <tr
                      key={row.studentId}
                      className="border-b hover:bg-slate-50"
                    >

                      <td className="px-4 py-3 text-xs text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium">{row.name}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          {row.studentCode}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        {row.attendanceScore.toFixed(1)}
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={row.midterm}
                          disabled={locked}
                          onChange={(e) =>
                            updateGrade(
                              row.studentId,
                              'midterm',
                              e.target.value
                            )
                          }
                          className="w-20 px-2 py-1 border rounded"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={row.final}
                          disabled={locked}
                          onChange={(e) =>
                            updateGrade(
                              row.studentId,
                              'final',
                              e.target.value
                            )
                          }
                          className="w-20 px-2 py-1 border rounded"
                        />
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        {row.totalScore ?? '—'}
                      </td>

                      <td className="px-4 py-3">
                        {row.letterGrade === '—'
                          ? '—'
                          : <Badge variant="success">{row.letterGrade}</Badge>}
                      </td>

                      <td className="px-4 py-3">
                        {row.gpaPoint ?? '—'}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </Card>

        )}

        {!selectedSection && (

          <div className="text-center py-20 text-slate-400">

            <ClipboardListIcon className="w-12 h-12 mx-auto mb-3 opacity-30"/>

            <p>Chọn lớp học phần để nhập điểm</p>

          </div>

        )}

        <Modal
          isOpen={importModalOpen}
          onClose={() => {
            setImportModalOpen(false)
            setImportFile(null)
            setImportRows([])
          }}
          title="Import bảng điểm"
          size="xl"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setImportModalOpen(false)
                  setImportFile(null)
                  setImportRows([])
                }}
              >
                Hủy
              </Button>
              <Button
                variant="outline"
                loading={importLoading}
                onClick={handlePreviewImport}
              >
                Đọc file
              </Button>
              <Button
                variant="primary"
                loading={importLoading}
                disabled={importRows.length === 0 || importReadyCount !== importRows.length}
                onClick={handleApplyImport}
              >
                Import vào lớp
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  File điểm
                </label>
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx,.txt,.doc,.docx,.json"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-slate-500">
                  Hỗ trợ Excel, CSV, Word, TXT và JSON. File sẽ được đọc trước khi lưu thật.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-800">Lớp học phần đang chọn</p>
                <p className="mt-1 font-mono">{selectedSection || 'Chưa chọn'}</p>
                <p className="mt-2 text-xs">
                  Nếu file không có cột chuyên cần, hệ thống sẽ lấy chuyên cần hiện có hoặc tự tính từ điểm danh.
                </p>
              </div>
            </div>

            {importRows.length > 0 && (
              <>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="info">Tổng: {importRows.length}</Badge>
                  <Badge variant="success">Sẵn sàng: {importReadyCount}</Badge>
                  <Badge variant="neutral">
                    Tạo mới: {importRows.filter((row) => row.operation === 'CREATE').length}
                  </Badge>
                  <Badge variant="warning">
                    Cập nhật: {importRows.filter((row) => row.operation === 'UPDATE').length}
                  </Badge>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[1040px] text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">#</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">Mã SV</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">Sinh viên</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">Chuyên cần</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">GK</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">CK</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">Tổng</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">Loại</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((row, index) => (
                        <tr key={`${row.rowNumber}-${index}`} className="border-b align-top">
                          <td className="px-3 py-3 text-xs text-slate-400">
                            {row.rowNumber}
                          </td>
                          <td className="px-3 py-3">
                            <input
                              value={row.studentId}
                              onChange={(e) => updateImportRow(index, 'studentId', e.target.value)}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-slate-800">{row.studentName ?? '—'}</p>
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={row.attendanceScore ?? ''}
                              onChange={(e) => updateImportRow(index, 'attendanceScore', e.target.value)}
                              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={row.midterm ?? ''}
                              onChange={(e) => updateImportRow(index, 'midterm', e.target.value)}
                              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={row.finalScore ?? ''}
                              onChange={(e) => updateImportRow(index, 'finalScore', e.target.value)}
                              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </td>
                          <td className="px-3 py-3 font-semibold">
                            {row.totalScore ?? '—'}
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant={row.operation === 'CREATE' ? 'info' : 'warning'}>
                              {row.operation === 'CREATE' ? 'Tạo mới' : 'Cập nhật'}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            {row.ready ? (
                              <Badge variant="success">Sẵn sàng</Badge>
                            ) : (
                              <div className="space-y-2">
                                <Badge variant="error">Cần sửa</Badge>
                                <div className="space-y-1">
                                  {row.issues.map((issue) => (
                                    <p key={issue} className="text-xs text-red-600">
                                      {issue}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </Modal>

      </div>

    </Layout>
  )
}
