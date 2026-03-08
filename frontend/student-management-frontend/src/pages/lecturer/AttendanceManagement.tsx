import React, { useEffect, useMemo, useState } from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SaveIcon,
  CheckSquareIcon
} from 'lucide-react'

import { Layout } from '../../components/layout/Layout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'

import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

import type {
  Attendance,
  CourseSection,
  Enrollment,
  Subject,
  User
} from '../../types'

import { getCourseSectionsApi } from '../../services/courseSectionService'
import { getSubjectsApi } from '../../services/subjectService'
import { getEnrollmentsApi } from '../../services/enrollmentService'
import { getUsersApi } from '../../services/userService'
import {
  getAttendanceApi,
  upsertAttendanceApi
} from '../../services/attendanceService'

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE'

export function AttendanceManagement() {

  const { currentUser } = useAuth()
  const { showToast } = useToast()

  const [selectedSection, setSelectedSection] = useState('')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceStatus>
  >({})

  const [saving, setSaving] = useState(false)

  const [savedRecords, setSavedRecords] = useState<Attendance[]>([])
  const [courseSections, setCourseSections] = useState<CourseSection[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {

    const loadData = async () => {
      try {

        const [
          sectionData,
          subjectData,
          enrollmentData,
          userData,
          attendanceData
        ] = await Promise.all([
          getCourseSectionsApi(),
          getSubjectsApi(),
          getEnrollmentsApi(),
          getUsersApi(),
          getAttendanceApi()
        ])

        setCourseSections(sectionData)
        setSubjects(subjectData)
        setEnrollments(enrollmentData)
        setUsers(userData)
        setSavedRecords(attendanceData)

      } catch {
        showToast('Không thể tải dữ liệu điểm danh', 'error')
      }
    }

    void loadData()

  }, [showToast])

  const myClasses = useMemo(
    () => courseSections.filter((cs) => cs.lecturerId === currentUser?.id),
    [courseSections, currentUser]
  )

  const sectionStudents = useMemo(() => {

    if (!selectedSection) return []

    return enrollments
      .filter(
        (e) =>
          e.courseSectionId === selectedSection &&
          e.status === 'ENROLLED'
      )
      .map((e) => users.find((u) => u.id === e.studentId))
      .filter(Boolean) as User[]

  }, [selectedSection, enrollments, users])

  const handleSectionChange = (sectionId: string) => {

    setSelectedSection(sectionId)

    const existing: Record<string, AttendanceStatus> = {}

    savedRecords
      .filter(
        (a) =>
          a.courseSectionId === sectionId &&
          a.date === selectedDate
      )
      .forEach((a) => {
        existing[a.studentId] = a.status
      })

    setAttendanceMap(existing)
  }

  const handleDateChange = (date: string) => {

    setSelectedDate(date)

    if (!selectedSection) return

    const existing: Record<string, AttendanceStatus> = {}

    savedRecords
      .filter(
        (a) =>
          a.courseSectionId === selectedSection &&
          a.date === date
      )
      .forEach((a) => {
        existing[a.studentId] = a.status
      })

    setAttendanceMap(existing)
  }

  const markAll = (status: AttendanceStatus) => {

    const newMap: Record<string, AttendanceStatus> = {}

    sectionStudents.forEach((s) => {
      newMap[s.id] = status
    })

    setAttendanceMap(newMap)
  }

  const handleSave = async () => {

    if (!selectedSection || !selectedDate) {
      showToast('Vui lòng chọn lớp và ngày', 'warning')
      return
    }

    try {

      setSaving(true)

      const newRecords: Attendance[] = []

      for (const s of sectionStudents) {

        const saved = await upsertAttendanceApi({
          studentId: s.id,
          courseSectionId: selectedSection,
          date: selectedDate,
          status: attendanceMap[s.id] ?? 'ABSENT'
        })

        newRecords.push(saved)
      }

      setSavedRecords((prev) => {

        const filtered = prev.filter(
          (a) =>
            !(
              a.courseSectionId === selectedSection &&
              a.date === selectedDate
            )
        )

        return [...filtered, ...newRecords]

      })

      showToast('Lưu điểm danh thành công!', 'success')

    } catch {

      showToast('Lưu điểm danh thất bại', 'error')

    } finally {

      setSaving(false)

    }
  }

  const historyDates = useMemo(() => {

    if (!selectedSection) return []

    const dates = [
      ...new Set(
        savedRecords
          .filter((a) => a.courseSectionId === selectedSection)
          .map((a) => a.date)
      )
    ]
      .sort()
      .reverse()

    return dates.slice(0, 5).map((date) => {

      const records = savedRecords.filter(
        (a) =>
          a.courseSectionId === selectedSection &&
          a.date === date
      )

      return {
        date,
        present: records.filter((a) => a.status === 'PRESENT').length,
        absent: records.filter((a) => a.status === 'ABSENT').length,
        late: records.filter((a) => a.status === 'LATE').length
      }
    })

  }, [selectedSection, savedRecords])

  const statusConfig = {

    PRESENT: {
      label: 'Có mặt',
      icon: <CheckCircleIcon className="w-4 h-4"/>,
      color: 'bg-emerald-100 border-emerald-300 text-emerald-700'
    },

    ABSENT: {
      label: 'Vắng',
      icon: <XCircleIcon className="w-4 h-4"/>,
      color: 'bg-red-100 border-red-300 text-red-700'
    },

    LATE: {
      label: 'Trễ',
      icon: <ClockIcon className="w-4 h-4"/>,
      color: 'bg-amber-100 border-amber-300 text-amber-700'
    }

  }

  return (

    <Layout title="Quản lý Điểm danh">

      <div className="space-y-8">

        <Card>

          <div className="flex flex-wrap items-end gap-4">

            <div className="flex-1 min-w-[220px]">

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
                  handleSectionChange(e.target.value)
                }
                placeholder="Chọn lớp học phần"
              />

            </div>

            <div className="w-44">

              <Input
                label="Ngày điểm danh"
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  handleDateChange(e.target.value)
                }
              />

            </div>

            <div className="flex gap-2">

              <Button
                variant="outline"
                size="sm"
                icon={<CheckSquareIcon className="w-4 h-4"/>}
                onClick={() => markAll('PRESENT')}
              >
                Tất cả có mặt
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={<SaveIcon className="w-4 h-4"/>}
                loading={saving}
                onClick={handleSave}
              >
                Lưu điểm danh
              </Button>

            </div>

          </div>

        </Card>

        {selectedSection && (

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2">

              <Card
                title={`Danh sách sinh viên (${sectionStudents.length})`}
                padding={false}
              >

                <div className="divide-y divide-slate-100">

                  {sectionStudents.map((student, idx) => {

                    const status =
                      attendanceMap[student.id] ?? 'ABSENT'

                    return (

                      <div
                        key={student.id}
                        className="
                        flex items-center gap-4 px-5 py-3
                        hover:bg-slate-50 transition
                      "
                      >

                        <span className="text-xs text-slate-400 w-6">
                          {idx + 1}
                        </span>

                        <div className="
                          w-9 h-9 rounded-full
                          bg-sky-100 flex items-center
                          justify-center font-bold text-sky-700
                        ">
                          {student.name.charAt(0)}
                        </div>

                        <div className="flex-1">

                          <p className="text-sm font-medium">
                            {student.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {student.studentId}
                          </p>

                        </div>

                        <div className="flex gap-1">

                          {(
                            ['PRESENT', 'LATE', 'ABSENT'] as AttendanceStatus[]
                          ).map((s) => (

                            <button
                              key={s}
                              onClick={() =>
                                setAttendanceMap((prev) => ({
                                  ...prev,
                                  [student.id]: s
                                }))
                              }
                              className={`
                                flex items-center gap-1
                                px-3 py-1.5
                                rounded-lg border text-xs font-medium
                                transition-all
                                ${
                                  status === s
                                    ? statusConfig[s].color
                                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                }
                              `}
                            >

                              {statusConfig[s].icon}

                              <span className="hidden sm:inline">
                                {statusConfig[s].label}
                              </span>

                            </button>

                          ))}

                        </div>

                      </div>

                    )
                  })}

                </div>

              </Card>

            </div>

            <div>

              <Card
                title="Lịch sử điểm danh"
                subtitle="5 buổi gần nhất"
              >

                <div className="space-y-3">

                  {historyDates.length === 0 ? (

                    <p className="text-sm text-slate-400 text-center py-6">
                      Chưa có lịch sử
                    </p>

                  ) : (

                    historyDates.map((h) => (

                      <div
                        key={h.date}
                        className="
                        p-3 bg-slate-50
                        rounded-lg border border-slate-100
                      "
                      >

                        <p className="text-xs font-semibold mb-2">
                          {h.date}
                        </p>

                        <div className="flex gap-3 text-xs">

                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircleIcon className="w-3 h-3"/>
                            {h.present}
                          </span>

                          <span className="flex items-center gap-1 text-red-600">
                            <XCircleIcon className="w-3 h-3"/>
                            {h.absent}
                          </span>

                          <span className="flex items-center gap-1 text-amber-600">
                            <ClockIcon className="w-3 h-3"/>
                            {h.late}
                          </span>

                        </div>

                      </div>

                    ))

                  )}

                </div>

              </Card>

            </div>

          </div>

        )}

        {!selectedSection && (

          <div className="text-center py-20 text-slate-400">

            <CheckSquareIcon className="w-12 h-12 mx-auto mb-3 opacity-30"/>

            <p>Chọn lớp học phần để bắt đầu điểm danh</p>

          </div>

        )}

      </div>

    </Layout>

  )
}