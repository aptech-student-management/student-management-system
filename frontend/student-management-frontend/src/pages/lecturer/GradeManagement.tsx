import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  SaveIcon,
  DownloadIcon,
  LockIcon,
  UnlockIcon,
  ClipboardListIcon
} from 'lucide-react'

import { Layout } from '../../components/layout/Layout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'

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
import { getGradesApi, upsertGradeApi } from '../../services/gradeService'

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

  const loadSection = useCallback((sectionId: string) => {

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

      const existing = grades.find(
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

      </div>

    </Layout>
  )
}
