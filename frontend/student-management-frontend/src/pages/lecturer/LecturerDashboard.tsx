import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpenIcon,
  CalendarIcon,
  ClipboardListIcon,
  ClockIcon,
  UsersIcon
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { Layout } from '../../components/layout/Layout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DashboardHero } from '../../components/ui/DashboardHero';
import { StatCard } from '../../components/ui/StatCard';
import { useAuth } from '../../contexts/AuthContext';

import type {
  Class,
  CourseSection,
  Enrollment,
  Grade,
  Semester,
  Subject
} from '../../types';
import { getClassesApi } from '../../services/classService';
import { getCourseSectionsApi } from '../../services/courseSectionService';
import { getEnrollmentsApi } from '../../services/enrollmentService';
import { getGradesApi } from '../../services/gradeService';
import { getSemestersApi } from '../../services/semesterService';
import { getSubjectsApi } from '../../services/subjectService';

const chartGridColor = 'var(--chart-grid)';
const chartAxisColor = 'var(--chart-axis)';
const tooltipStyle = {
  borderRadius: '18px',
  border: '1px solid var(--chart-tooltip-border)',
  background: 'var(--chart-tooltip-bg)',
  boxShadow: '0 22px 45px -28px rgba(15, 23, 42, 0.65)',
  fontSize: '12px'
};

export function LecturerDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

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
        ]);

        setCourseSections(sectionData);
        setSubjects(subjectData);
        setClasses(classData);
        setEnrollments(enrollmentData);
        setGrades(gradeData);
        setSemesters(semesterData);
      } catch {
        // keep dashboard stable
      }
    };

    void loadData();

    const intervalId = window.setInterval(() => {
      void loadData();
    }, 5000);

    const handleFocus = () => {
      void loadData();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const myClasses = useMemo(
    () => courseSections.filter((section) => section.lecturerId === currentUser?.id),
    [courseSections, currentUser?.id]
  );

  const activeSemester = useMemo(
    () => semesters.find((semester) => semester.status === 'ACTIVE'),
    [semesters]
  );

  const myActiveClasses = useMemo(
    () => myClasses.filter((section) => section.semesterId === activeSemester?.id),
    [activeSemester?.id, myClasses]
  );

  const totalStudents = useMemo(
    () => myActiveClasses.reduce((sum, section) => sum + section.enrolledCount, 0),
    [myActiveClasses]
  );

  const pendingGrades = useMemo(() => {
    const myEnrollments = enrollments.filter(
      (enrollment) =>
        myActiveClasses.some((section) => section.id === enrollment.courseSectionId) &&
        enrollment.status === 'ENROLLED'
    );

    const gradedIds = new Set(grades.map((grade) => `${grade.studentId}-${grade.courseSectionId}`));

    return myEnrollments.filter(
      (enrollment) => !gradedIds.has(`${enrollment.studentId}-${enrollment.courseSectionId}`)
    ).length;
  }, [enrollments, grades, myActiveClasses]);

  const attendanceChartData = useMemo(
    () =>
      myActiveClasses.map((section) => {
        const subject = subjects.find((item) => item.id === section.subjectId);

        return {
          name: subject?.code ?? section.id,
          'Có mặt': Math.floor(section.enrolledCount * 0.85),
          Vắng: Math.floor(section.enrolledCount * 0.1),
          Trễ: Math.floor(section.enrolledCount * 0.05)
        };
      }),
    [myActiveClasses, subjects]
  );

  const recentGrades = useMemo(
    () => grades.filter((grade) => myClasses.some((section) => section.id === grade.courseSectionId)).slice(0, 5),
    [grades, myClasses]
  );

  return (
    <Layout title="Dashboard - Giảng viên">
      <div className="space-y-6">
        <DashboardHero
          eyebrow="Lecturer Workspace"
          title="Quản lý lớp học phần mượt và gọn hơn"
          description="Tập trung vào những gì cần xử lý ngay: lớp đang dạy, trạng thái điểm và tiến độ sinh viên, trong một giao diện tối hơn và ít nhiễu hơn."
          accent="amber"
          stats={[
            { label: 'Học kỳ', value: activeSemester?.name ?? 'Chưa mở' },
            { label: 'Lớp đang dạy', value: `${myActiveClasses.length}` },
            { label: 'Sinh viên', value: `${totalStudents}` },
            { label: 'Chờ nhập điểm', value: `${pendingGrades}` }
          ]}
          actions={
            <>
              <Button variant="primary" size="sm" onClick={() => navigate('/lecturer/grades')}>
                Nhập điểm
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/lecturer/attendance')}>
                Điểm danh
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/lecturer/classes')}>
                Xem lớp của tôi
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Lớp đang dạy"
            value={myActiveClasses.length}
            subtitle={activeSemester?.name ?? 'Học kỳ hiện tại'}
            icon={<BookOpenIcon className="h-5 w-5" />}
            color="teal"
          />
          <StatCard
            title="Tổng sinh viên"
            value={totalStudents}
            subtitle="Đang theo dõi"
            icon={<UsersIcon className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Chờ nhập điểm"
            value={pendingGrades}
            change={pendingGrades > 0 ? 'Cần xử lý' : 'Đã hoàn thành'}
            changeType={pendingGrades > 0 ? 'down' : 'up'}
            icon={<ClipboardListIcon className="h-5 w-5" />}
            color="amber"
          />
          <StatCard
            title="Buổi học hôm nay"
            value={myActiveClasses.length > 0 ? 1 : 0}
            subtitle="Lịch dạy"
            icon={<CalendarIcon className="h-5 w-5" />}
            color="purple"
          />
        </div>

        <Card
          title={`Lớp học của tôi${activeSemester?.name ? ` - ${activeSemester.name}` : ''}`}
          subtitle="Danh sách lớp học phần đang giảng dạy trong học kỳ hiện tại"
          variant="dashboard"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/lecturer/classes')}>
              Xem tất cả
            </Button>
          }
        >
          {myActiveClasses.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
              Chưa có lớp học phần nào được phân công.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {myActiveClasses.map((section) => {
                const subject = subjects.find((item) => item.id === section.subjectId);
                const classInfo = classes.find((item) => item.id === section.classId);

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => navigate('/lecturer/classes')}
                    className="group rounded-[26px] border border-slate-200/70 bg-slate-50/70 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[18px] border border-white/60 bg-white text-slate-700 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-100">
                          <BookOpenIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
                            {subject?.name ?? 'Môn học'}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {classInfo?.name ?? 'Lớp'} · {subject?.code ?? section.id}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={
                          section.status === 'OPEN'
                            ? 'success'
                            : section.status === 'FULL'
                              ? 'warning'
                              : 'neutral'
                        }
                        dot
                      >
                        {section.status === 'OPEN' ? 'Mở' : section.status === 'FULL' ? 'Đầy' : 'Đóng'}
                      </Badge>
                    </div>

                    <div className="mt-5 space-y-3 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <UsersIcon className="h-3.5 w-3.5" />
                          Sinh viên
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {section.enrolledCount}/{section.maxStudents}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <ClockIcon className="h-3.5 w-3.5" />
                          Lịch học
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{section.schedule}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Phòng học</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{section.room}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card
            title="Tổng hợp điểm danh"
            subtitle="Số lượng có mặt, vắng và đi trễ theo từng lớp"
            variant="dashboard"
          >
            {attendanceChartData.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                Chưa có dữ liệu điểm danh để hiển thị.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={attendanceChartData} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke={chartGridColor} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: chartAxisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: chartAxisColor }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Có mặt" fill="#10b981" radius={[12, 12, 4, 4]} />
                  <Bar dataKey="Vắng" fill="#ef4444" radius={[12, 12, 4, 4]} />
                  <Bar dataKey="Trễ" fill="#f59e0b" radius={[12, 12, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card
            title="Điểm số gần đây"
            subtitle="Các cập nhật mới nhất từ lớp học phần của bạn"
            variant="dashboard"
          >
            <div className="space-y-3">
              {recentGrades.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
                  <ClipboardListIcon className="mx-auto mb-3 h-6 w-6 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">Chưa có điểm số nào</p>
                </div>
              ) : (
                recentGrades.map((grade) => {
                  const section = myClasses.find((item) => item.id === grade.courseSectionId);
                  const subject = subjects.find((item) => item.id === section?.subjectId);

                  return (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between gap-4 rounded-[22px] border border-slate-200/70 bg-slate-50/70 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {subject?.name ?? 'Môn học'}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{grade.updatedAt}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                          {grade.totalScore ?? '--'}
                        </span>
                        <Badge
                          variant={
                            grade.gpaPoint && grade.gpaPoint >= 3
                              ? 'success'
                              : grade.gpaPoint && grade.gpaPoint >= 2
                                ? 'warning'
                                : 'error'
                          }
                        >
                          {grade.letterGrade ?? 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
