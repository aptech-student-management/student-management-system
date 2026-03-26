import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AwardIcon,
  BookOpenIcon,
  ClockIcon,
  TargetIcon,
  TrendingUpIcon
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
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
import { useToast } from '../../contexts/ToastContext';

import type { CourseSection, EarlyWarning, Enrollment, Grade, Semester, Subject } from '../../types';
import { getCourseSectionsApi } from '../../services/courseSectionService';
import { getEarlyWarningApi } from '../../services/earlyWarningService';
import { getEnrollmentsApi } from '../../services/enrollmentService';
import { getGradesApi } from '../../services/gradeService';
import { getSemestersApi } from '../../services/semesterService';
import { getSubjectsApi } from '../../services/subjectService';

const TOTAL_CREDITS_REQUIRED = 120;
const chartGridColor = 'var(--chart-grid)';
const chartAxisColor = 'var(--chart-axis)';
const tooltipStyle = {
  borderRadius: '18px',
  border: '1px solid var(--chart-tooltip-border)',
  background: 'var(--chart-tooltip-bg)',
  boxShadow: '0 22px 45px -28px rgba(15, 23, 42, 0.65)',
  fontSize: '12px'
};

export function StudentDashboard() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [earlyWarning, setEarlyWarning] = useState<EarlyWarning | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [enrollmentData, sectionData, subjectData, gradeData, semesterData] = await Promise.all([
          getEnrollmentsApi(),
          getCourseSectionsApi(),
          getSubjectsApi(),
          getGradesApi({ studentId: currentUser?.studentId }),
          getSemestersApi()
        ]);

        setEnrollments(enrollmentData);
        setCourseSections(sectionData);
        setSubjects(subjectData);
        setGrades(gradeData);
        setSemesters(semesterData);
      } catch {
        showToast('Không thể tải dữ liệu dashboard sinh viên', 'error');
      }
    };

    if (currentUser?.studentId) {
      void loadData();
    }
  }, [currentUser?.studentId, showToast]);

  useEffect(() => {
    const loadEarlyWarning = async () => {
      if (!currentUser?.studentId) return;

      try {
        const data = await getEarlyWarningApi(currentUser.studentId);
        setEarlyWarning(data);
      } catch {
        setEarlyWarning(null);
      }
    };

    void loadEarlyWarning();
  }, [currentUser?.studentId]);

  const myEnrollments = useMemo(
    () =>
      enrollments.filter(
        (enrollment) =>
          enrollment.studentId === currentUser?.studentId && enrollment.status === 'ENROLLED'
      ),
    [currentUser?.studentId, enrollments]
  );

  const activeSemester = useMemo(
    () => semesters.find((semester) => semester.status === 'ACTIVE') ?? semesters[0],
    [semesters]
  );

  const currentCourses = useMemo(
    () =>
      myEnrollments
        .map((enrollment) => courseSections.find((section) => section.id === enrollment.courseSectionId))
        .filter(
          (section): section is CourseSection =>
            Boolean(section) && section.semesterId === activeSemester?.id
        ),
    [activeSemester?.id, courseSections, myEnrollments]
  );

  const myGrades = useMemo(
    () => grades.filter((grade) => grade.studentId === currentUser?.studentId),
    [currentUser?.studentId, grades]
  );

  const completedCredits = useMemo(
    () =>
      myGrades
        .filter((grade) => grade.gpaPoint !== undefined && grade.gpaPoint > 0)
        .reduce((sum, grade) => {
          const section = courseSections.find((item) => item.id === grade.courseSectionId);
          const subject = subjects.find((item) => item.id === section?.subjectId);
          return sum + (subject?.credits ?? 0);
        }, 0),
    [courseSections, myGrades, subjects]
  );

  const currentSemGPA = useMemo(() => {
    const currentGrades = myGrades.filter((grade) => {
      const section = courseSections.find((item) => item.id === grade.courseSectionId);

      return section?.semesterId === activeSemester?.id && grade.gpaPoint !== undefined;
    });

    if (currentGrades.length === 0) return null;

    const totalPoints = currentGrades.reduce((sum, grade) => {
      const section = courseSections.find((item) => item.id === grade.courseSectionId);
      const subject = subjects.find((item) => item.id === section?.subjectId);
      return sum + (grade.gpaPoint ?? 0) * (subject?.credits ?? 0);
    }, 0);

    const totalCredits = currentGrades.reduce((sum, grade) => {
      const section = courseSections.find((item) => item.id === grade.courseSectionId);
      const subject = subjects.find((item) => item.id === section?.subjectId);
      return sum + (subject?.credits ?? 0);
    }, 0);

    return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : null;
  }, [activeSemester?.id, courseSections, myGrades, subjects]);

  const cumulativeGPA = useMemo(() => {
    const gradedItems = myGrades.filter((grade) => grade.gpaPoint !== undefined);

    if (gradedItems.length === 0) return null;

    const totalPoints = gradedItems.reduce((sum, grade) => {
      const section = courseSections.find((item) => item.id === grade.courseSectionId);
      const subject = subjects.find((item) => item.id === section?.subjectId);
      return sum + (grade.gpaPoint ?? 0) * (subject?.credits ?? 0);
    }, 0);

    const totalCredits = gradedItems.reduce((sum, grade) => {
      const section = courseSections.find((item) => item.id === grade.courseSectionId);
      const subject = subjects.find((item) => item.id === section?.subjectId);
      return sum + (subject?.credits ?? 0);
    }, 0);

    return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : null;
  }, [courseSections, myGrades, subjects]);

  const gpaHistory = useMemo(() => {
    const semGpaMap = semesters
      .map((semester) => {
        const semGrades = myGrades.filter((grade) => {
          const section = courseSections.find((item) => item.id === grade.courseSectionId);
          return section?.semesterId === semester.id && grade.gpaPoint !== undefined;
        });

        if (semGrades.length === 0) return null;

        const totalPoints = semGrades.reduce((sum, grade) => {
          const section = courseSections.find((item) => item.id === grade.courseSectionId);
          const subject = subjects.find((item) => item.id === section?.subjectId);
          return sum + (grade.gpaPoint ?? 0) * (subject?.credits ?? 0);
        }, 0);

        const totalCredits = semGrades.reduce((sum, grade) => {
          const section = courseSections.find((item) => item.id === grade.courseSectionId);
          const subject = subjects.find((item) => item.id === section?.subjectId);
          return sum + (subject?.credits ?? 0);
        }, 0);

        if (totalCredits === 0) return null;

        return {
          name: semester.name,
          GPA: Math.round((totalPoints / totalCredits) * 100) / 100
        };
      })
      .filter(Boolean) as { name: string; GPA: number }[];

    return semGpaMap.slice(-4);
  }, [courseSections, myGrades, semesters, subjects]);

  const creditProgress = Math.min((completedCredits / TOTAL_CREDITS_REQUIRED) * 100, 100);

  const riskBadgeClass =
    earlyWarning?.riskLevel === 'HIGH'
      ? 'border-red-400/15 bg-red-500/10 text-red-700 dark:text-red-200'
      : earlyWarning?.riskLevel === 'MEDIUM'
        ? 'border-amber-400/15 bg-amber-500/10 text-amber-700 dark:text-amber-200'
        : 'border-emerald-400/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';

  return (
    <Layout title="Dashboard - Sinh viên">
      <div className="space-y-6">
        <DashboardHero
          eyebrow="Student Flow"
          title="Theo dõi lộ trình học tập rõ ràng hơn"
          description="Mọi thông tin quan trọng của học kỳ được gom lại theo kiểu tối giản: GPA, tiến độ tín chỉ, cảnh báo sớm và danh sách môn học hiện tại."
          accent="blue"
          stats={[
            { label: 'Học kỳ', value: activeSemester?.name ?? 'Chưa có' },
            { label: 'GPA kỳ này', value: currentSemGPA?.toFixed(2) ?? 'N/A' },
            { label: 'Tín chỉ', value: `${completedCredits}/${TOTAL_CREDITS_REQUIRED}` },
            { label: 'Mức rủi ro', value: earlyWarning?.riskLevel ?? 'LOW' }
          ]}
          actions={
            <>
              <Button variant="primary" size="sm" onClick={() => navigate('/student/registration')}>
                Đăng ký môn học
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/student/schedule')}>
                Xem thời khóa biểu
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="GPA học kỳ"
            value={currentSemGPA?.toFixed(2) ?? 'N/A'}
            change={currentSemGPA && currentSemGPA >= 3 ? 'Xuất sắc' : 'Cần cải thiện'}
            changeType={currentSemGPA && currentSemGPA >= 3 ? 'up' : 'down'}
            icon={<TrendingUpIcon className="h-5 w-5" />}
            color="sky"
            subtitle={activeSemester?.name}
          />
          <StatCard
            title="GPA tích lũy"
            value={cumulativeGPA?.toFixed(2) ?? 'N/A'}
            subtitle="Toàn khóa"
            icon={<AwardIcon className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Tín chỉ"
            value={`${completedCredits}/${TOTAL_CREDITS_REQUIRED}`}
            subtitle={`Còn ${Math.max(TOTAL_CREDITS_REQUIRED - completedCredits, 0)} tín chỉ`}
            icon={<TargetIcon className="h-5 w-5" />}
            color="emerald"
          />
          <StatCard
            title="Môn học hiện tại"
            value={currentCourses.length}
            subtitle={activeSemester?.name}
            icon={<BookOpenIcon className="h-5 w-5" />}
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card
            title="Tiến độ tín chỉ"
            subtitle={`${completedCredits}/${TOTAL_CREDITS_REQUIRED} tín chỉ đã hoàn thành`}
            variant="dashboard"
          >
            <div className="space-y-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                    Completion
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-slate-50">
                    {Math.round(creditProgress)}%
                  </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-slate-300">
                  Mục tiêu {TOTAL_CREDITS_REQUIRED} TC
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.05]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 transition-all duration-700"
                  style={{ width: `${creditProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Đã hoàn thành</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">{completedCredits} TC</p>
                </div>
                <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Còn lại</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                    {Math.max(TOTAL_CREDITS_REQUIRED - completedCredits, 0)} TC
                  </p>
                </div>
                <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Môn học hiện tại</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">{currentCourses.length}</p>
                </div>
              </div>
            </div>
          </Card>

          {earlyWarning ? (
            <Card
              title="AI Early Warning"
              subtitle="Đánh giá nguy cơ học tập theo dữ liệu điểm và chuyên cần"
              variant="dashboard"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={riskBadgeClass}>Mức nguy cơ: {earlyWarning.riskLevel}</Badge>
                  <Badge variant="info">Điểm rủi ro: {earlyWarning.riskScore.toFixed(1)}/100</Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tỷ lệ chuyên cần</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                      {(earlyWarning.attendanceRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">GPA trung bình</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                      {earlyWarning.averageGpa?.toFixed(2) ?? 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Môn có nguy cơ trượt</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                      {earlyWarning.failedCourseCount}
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Gợi ý từ AI</p>
                  <div className="space-y-2">
                    {earlyWarning.recommendations.map((recommendation) => (
                      <div
                        key={recommendation}
                        className="rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-slate-300"
                      >
                        {recommendation}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card
              title="AI Early Warning"
              subtitle="Khi có dữ liệu phù hợp, hệ thống sẽ hiển thị cảnh báo sớm ở đây"
              variant="dashboard"
            >
              <div className="flex h-full min-h-[250px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-400 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-slate-500">
                Chưa có cảnh báo học tập cho thời điểm hiện tại.
              </div>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          <Card
            title="Môn học hiện tại"
            subtitle={activeSemester?.name}
            variant="dashboard"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/student/registration')}>
                Xem thêm
              </Button>
            }
          >
            <div className="space-y-3">
              {currentCourses.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                  Chưa đăng ký môn học.
                </p>
              ) : (
                currentCourses.map((section) => {
                  const subject = subjects.find((item) => item.id === section.subjectId);

                  return (
                    <div
                      key={section.id}
                      className="flex items-center gap-3 rounded-[22px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/60 bg-white text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-100">
                        <BookOpenIcon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {subject?.name ?? 'Môn học'}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {section.schedule} · Phòng {section.room}
                        </p>
                      </div>

                      <Badge variant="info">{subject?.credits ?? 0} TC</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card title="Xu hướng GPA" subtitle="4 học kỳ gần nhất" variant="dashboard">
            {gpaHistory.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                Chưa có dữ liệu GPA theo học kỳ.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={gpaHistory} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke={chartGridColor} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: chartAxisColor }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={[2.5, 4]}
                    tick={{ fontSize: 12, fill: chartAxisColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, 'GPA']} />
                  <Line
                    type="monotone"
                    dataKey="GPA"
                    strokeWidth={3}
                    stroke="#3b82f6"
                    dot={{ r: 4, fill: '#60a5fa', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#93c5fd' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <Card
          title="Lịch học hôm nay"
          icon={<ClockIcon className="h-4 w-4" />}
          variant="dashboard"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/student/schedule')}>
              Xem TKB
            </Button>
          }
        >
          <div className="space-y-3">
            {currentCourses.slice(0, 2).map((section) => {
              const subject = subjects.find((item) => item.id === section.subjectId);

              return (
                <div
                  key={section.id}
                  className="flex items-center gap-4 rounded-[24px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <div className="min-w-[78px] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-slate-200">
                    {section.schedule}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{subject?.name ?? 'Môn học'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Phòng {section.room}</p>
                  </div>
                </div>
              );
            })}

            {currentCourses.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                Không có lịch học hôm nay.
              </p>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
