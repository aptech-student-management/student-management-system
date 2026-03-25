import React, { useEffect, useMemo, useState } from 'react'
import {
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
  MapPinIcon
} from 'lucide-react'

import { Layout } from '../../components/layout/Layout'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../contexts/AuthContext'

import type {
  CourseSection,
  Enrollment,
  Semester,
  Subject,
  Class,
  User
} from '../../types'

import { getCourseSectionsApi } from '../../services/courseSectionService'
import { getSubjectsApi } from '../../services/subjectService'
import { getClassesApi } from '../../services/classService'
import { getSemestersApi } from '../../services/semesterService'
import { getEnrollmentsApi } from '../../services/enrollmentService'
import { getUsersApi } from '../../services/userService'

export function MyClasses() {
  const { currentUser } = useAuth()

  const [courseSections, setCourseSections] = useState<CourseSection[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [users, setUsers] = useState<User[]>([])

  const [filterSemester, setFilterSemester] = useState('')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          sectionData,
          subjectData,
          classData,
          semesterData,
          enrollmentData,
          userData
        ] = await Promise.all([
          getCourseSectionsApi(),
          getSubjectsApi(),
          getClassesApi(),
          getSemestersApi(),
          getEnrollmentsApi(),
          getUsersApi()
        ])

        setCourseSections(sectionData)
        setSubjects(subjectData)
        setClasses(classData)
        setSemesters(semesterData)
        setEnrollments(enrollmentData)
        setUsers(userData)

        const activeSem = semesterData.find((s) => s.status === 'ACTIVE')
        setFilterSemester(activeSem?.id ?? '')
      } catch {}
    }

    void loadData()

    const intervalId = window.setInterval(() => {
      void loadData()
    }, 5000)

    const handleFocus = () => {
      void loadData()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [])

  const myClasses = useMemo(
    () =>
      courseSections.filter(
        (cs) =>
          cs.lecturerId === currentUser?.id &&
          (filterSemester ? cs.semesterId === filterSemester : true)
      ),
    [courseSections, currentUser?.id, filterSemester]
  )

  const selectedSectionData = selectedSection
    ? courseSections.find((cs) => cs.id === selectedSection)
    : null

  const sectionStudents = useMemo(() => {
    if (!selectedSection) return []

    return enrollments
      .filter(
        (e) => e.courseSectionId === selectedSection && e.status === 'ENROLLED'
      )
      .map((e) => users.find((u) => u.studentId === e.studentId))
      .filter(Boolean) as User[]
  }, [selectedSection, enrollments, users])

  return (
    <Layout title="Lớp học của tôi">
      <div className="space-y-8">

        {/* FILTER */}

        <div className="flex items-center justify-between flex-wrap gap-4">

          <div className="flex items-center gap-3">

            <div className="w-56">
              <Select
                options={semesters.map((s) => ({
                  value: s.id,
                  label: s.name
                }))}
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                placeholder="Tất cả học kỳ"
              />
            </div>

            <span className="text-sm text-slate-500">
              {myClasses.length} lớp học phần
            </span>

          </div>

        </div>

        {/* CLASS CARDS */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          {myClasses.map((cs) => {

            const subj = subjects.find((s) => s.id === cs.subjectId)
            const cls = classes.find((c) => c.id === cs.classId)
            const sem = semesters.find((s) => s.id === cs.semesterId)

            return (
              <div
                key={cs.id}
                onClick={() => setSelectedSection(cs.id)}
                className="
                  group
                  bg-white
                  border border-slate-200
                  rounded-2xl
                  p-5
                  cursor-pointer
                  transition-all
                  hover:shadow-lg
                  hover:-translate-y-1
                  hover:border-teal-400
                "
              >

                {/* HEADER */}

                <div className="flex items-start justify-between mb-4">

                  <div className="flex items-center gap-3">

                    <div className="
                      w-11 h-11
                      rounded-xl
                      bg-teal-50
                      flex items-center justify-center
                      group-hover:bg-teal-100
                      transition
                    ">
                      <BookOpenIcon className="w-5 h-5 text-teal-600"/>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {subj?.name}
                      </h3>

                      <p className="text-xs text-slate-500">
                        {subj?.code} · {subj?.credits} tín chỉ
                      </p>
                    </div>

                  </div>

                  <Badge
                    variant={
                      cs.status === 'OPEN'
                        ? 'success'
                        : cs.status === 'FULL'
                        ? 'warning'
                        : 'neutral'
                    }
                    dot
                  >
                    {cs.status === 'OPEN'
                      ? 'Mở'
                      : cs.status === 'FULL'
                      ? 'Đầy'
                      : 'Đóng'}
                  </Badge>

                </div>

                {/* INFO */}

                <div className="space-y-2 text-xs text-slate-600">

                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-3.5 h-3.5 text-slate-400"/>
                    {cls?.name}
                  </div>

                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-3.5 h-3.5 text-slate-400"/>
                    {cs.schedule}
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400"/>
                    Phòng {cs.room}
                  </div>

                </div>

                {/* FOOTER */}

                <div className="
                  mt-4
                  pt-3
                  border-t
                  border-slate-100
                  flex
                  items-center
                  justify-between
                ">

                  <span className="text-xs text-slate-500">
                    {sem?.name}
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    {cs.enrolledCount}/{cs.maxStudents}
                  </span>

                </div>

              </div>
            )
          })}

          {/* EMPTY STATE */}

          {myClasses.length === 0 && (

            <div className="col-span-full text-center py-20">

              <BookOpenIcon className="w-10 h-10 mx-auto text-slate-300 mb-3"/>

              <p className="text-sm text-slate-500">
                Không có lớp học nào trong học kỳ này
              </p>

            </div>

          )}

        </div>

      </div>

      {/* STUDENT MODAL */}

      <Modal
        isOpen={!!selectedSection}
        onClose={() => setSelectedSection(null)}
        title={`Danh sách sinh viên — ${
          subjects.find((s) => s.id === selectedSectionData?.subjectId)?.name ?? ''
        }`}
        size="lg"
      >

        <div className="space-y-4">

          <p className="text-sm text-slate-500">
            {sectionStudents.length} sinh viên đã đăng ký
          </p>

          <div className="space-y-2">

            {sectionStudents.map((student, idx) => {

              const cls = classes.find((c) => c.id === student.classId)

              return (
                <div
                  key={student.id}
                  className="
                    flex
                    items-center
                    gap-3
                    py-2.5
                    px-2
                    rounded-lg
                    hover:bg-slate-50
                    transition
                  "
                >

                  <span className="text-xs text-slate-400 w-6 text-right">
                    {idx + 1}
                  </span>

                  <div className="
                    w-8
                    h-8
                    rounded-full
                    bg-sky-100
                    flex
                    items-center
                    justify-center
                    text-sm
                    font-bold
                    text-sky-700
                    flex-shrink-0
                  ">
                    {student.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">

                    <p className="text-sm font-medium text-slate-900">
                      {student.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {student.studentId} · {student.email}
                    </p>

                  </div>

                  <Badge variant="neutral">
                    {cls?.name ?? '—'}
                  </Badge>

                </div>
              )
            })}

          </div>

        </div>

      </Modal>
    </Layout>
  )
}
