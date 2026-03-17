import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpenIcon,
  UsersIcon,
  ClipboardListIcon,
  CalendarIcon,
  ClockIcon
} from 'lucide-react'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

import { Layout } from '../../components/layout/Layout'
import { StatCard } from '../../components/ui/StatCard'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'

import type {
  CourseSection,
  Enrollment,
  Grade,
  Semester,
  Subject,
  Class
} from '../../types'

import { getCourseSectionsApi } from '../../services/courseSectionService'
import { getSubjectsApi } from '../../services/subjectService'
import { getClassesApi } from '../../services/classService'
import { getEnrollmentsApi } from '../../services/enrollmentService'
import { getGradesApi } from '../../services/gradeService'
import { getSemestersApi } from '../../services/semesterService'

export function LecturerDashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [courseSections, setCourseSections] = useState<CourseSection[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          sectionData,
          subjectData,
          classData,
          enrollmentData,
          gradeData,
          semesterData
        ] = await Promise.all([
          getCourseSectionsApi(),
          getSubjectsApi(),
          getClassesApi(),
          getEnrollmentsApi(),
          getGradesApi(),
          getSemestersApi()
        ])

        setCourseSections(sectionData)
        setSubjects(subjectData)
        setClasses(classData)
        setEnrollments(enrollmentData)
        setGrades(gradeData)
        setSemesters(semesterData)
      } catch {
        // keep UI stable
      }
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
    () => courseSections.filter((cs) => cs.lecturerId === currentUser?.id),
    [courseSections, currentUser]
  )

  const activeSemester = semesters.find((s) => s.status === 'ACTIVE')

  const myActiveClasses = myClasses.filter(
    (cs) => cs.semesterId === activeSemester?.id
  )

  const totalStudents = useMemo(
    () => myActiveClasses.reduce((sum, cs) => sum + cs.enrolledCount, 0),
    [myActiveClasses]
  )

  const pendingGrades = useMemo(() => {
    const myEnrollments = enrollments.filter(
      (e) =>
        myActiveClasses.some((cs) => cs.id === e.courseSectionId) &&
        e.status === 'ENROLLED'
    )

    const gradedIds = new Set(
      grades.map((g) => `${g.studentId}-${g.courseSectionId}`)
    )

    return myEnrollments.filter(
      (e) => !gradedIds.has(`${e.studentId}-${e.courseSectionId}`)
    ).length
  }, [myActiveClasses, enrollments, grades])

  const attendanceChartData = useMemo(
    () =>
      myActiveClasses.map((cs) => {
        const subj = subjects.find((s) => s.id === cs.subjectId)

        return {
          name: subj?.code ?? cs.id,
          'Có mặt': Math.floor(cs.enrolledCount * 0.85),
          Vắng: Math.floor(cs.enrolledCount * 0.1),
          Trễ: Math.floor(cs.enrolledCount * 0.05)
        }
      }),
    [myActiveClasses, subjects]
  )

  const recentGrades = grades
    .filter((g) => myClasses.some((cs) => cs.id === g.courseSectionId))
    .slice(0, 5)

  return (
    <Layout title="Dashboard - Giảng viên">
      <div className="space-y-8">

        {/* STAT CARDS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Lớp đang dạy"
            value={myActiveClasses.length}
            subtitle={activeSemester?.name}
            icon={<BookOpenIcon className="w-5 h-5" />}
            color="teal"
          />

          <StatCard
            title="Tổng sinh viên"
            value={totalStudents}
            subtitle="Học kỳ hiện tại"
            icon={<UsersIcon className="w-5 h-5" />}
            color="blue"
          />

          <StatCard
            title="Chờ nhập điểm"
            value={pendingGrades}
            change={pendingGrades > 0 ? 'Cần xử lý' : 'Đã hoàn thành'}
            changeType={pendingGrades > 0 ? 'down' : 'up'}
            icon={<ClipboardListIcon className="w-5 h-5" />}
            color="amber"
          />

          <StatCard
            title="Buổi học hôm nay"
            value={myActiveClasses.length > 0 ? 1 : 0}
            subtitle="Lịch học"
            icon={<CalendarIcon className="w-5 h-5" />}
            color="purple"
          />
        </div>

        {/* MY CLASSES */}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Lớp học của tôi ({activeSemester?.name})
            </h2>

            <Button
              variant="ghost"
              size="sm"
              className="text-teal-600 hover:text-teal-700"
              onClick={() => navigate('/lecturer/classes')}
            >
              Xem tất cả
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {myActiveClasses.map((cs) => {

              const subj = subjects.find((s) => s.id === cs.subjectId)
              const cls = classes.find((c) => c.id === cs.classId)

              return (
                <div
                  key={cs.id}
                  onClick={() => navigate('/lecturer/classes')}
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

                  <div className="flex justify-between items-start mb-4">

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
                          {cls?.name}
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

                  <div className="space-y-2 text-xs text-slate-600">

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <UsersIcon className="w-3 h-3"/>
                        Sinh viên
                      </span>

                      <span className="font-medium">
                        {cs.enrolledCount}/{cs.maxStudents}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3"/>
                        Lịch học
                      </span>

                      <span className="font-medium">
                        {cs.schedule}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Phòng</span>

                      <span className="font-medium">
                        {cs.room}
                      </span>
                    </div>

                  </div>

                </div>
              )
            })}

          </div>
        </div>

        {/* CHART + GRADES */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Card title="Tổng hợp điểm danh" subtitle="Theo lớp học phần">

            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={attendanceChartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 5
                }}
              >

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />

                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                />

                <Bar dataKey="Có mặt" fill="#0d9488" radius={[3,3,0,0]}/>
                <Bar dataKey="Vắng" fill="#ef4444" radius={[3,3,0,0]}/>
                <Bar dataKey="Trễ" fill="#f59e0b" radius={[3,3,0,0]}/>

              </BarChart>
            </ResponsiveContainer>

          </Card>

          <Card title="Điểm số gần đây" subtitle="Cập nhật mới nhất">

            <div className="space-y-3">

              {recentGrades.length === 0 ? (

                <div className="text-center py-10">
                  <ClipboardListIcon className="w-6 h-6 text-slate-300 mx-auto mb-2"/>
                  <p className="text-sm text-slate-400">
                    Chưa có điểm số nào
                  </p>
                </div>

              ) : (

                recentGrades.map((g) => {

                  const cs = myClasses.find((c) => c.id === g.courseSectionId)
                  const subj = subjects.find((s) => s.id === cs?.subjectId)

                  return (
                    <div
                      key={g.id}
                      className="
                        flex
                        items-center
                        justify-between
                        py-2
                        border-b
                        border-slate-50
                        last:border-0
                      "
                    >

                      <div>
                        <p className="text-xs font-medium text-slate-800">
                          {subj?.name}
                        </p>

                        <p className="text-xs text-slate-400">
                          {g.updatedAt}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">

                        <span className="text-sm font-bold text-slate-900">
                          {g.totalScore}
                        </span>

                        <Badge
                          variant={
                            g.gpaPoint && g.gpaPoint >= 3
                              ? 'success'
                              : g.gpaPoint && g.gpaPoint >= 2
                              ? 'warning'
                              : 'error'
                          }
                        >
                          {g.letterGrade}
                        </Badge>

                      </div>

                    </div>
                  )
                })
              )}

            </div>

          </Card>

        </div>

      </div>
    </Layout>
  )
}
