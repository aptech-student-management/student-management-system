import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUpIcon,
  BookOpenIcon,
  AwardIcon,
  TargetIcon,
  ClockIcon } from
'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from
'recharts';
import { Layout } from '../../components/layout/Layout';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import {
  enrollments,
  courseSections,
  subjects,
  grades,
  semesters } from
'../../data/mockData';
const TOTAL_CREDITS_REQUIRED = 120;
export function StudentDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const myEnrollments = useMemo(
    () =>
    enrollments.filter(
      (e) => e.studentId === currentUser?.id && e.status === 'ENROLLED'
    ),
    [currentUser]
  );
  const activeSemester = semesters.find((s) => s.status === 'ACTIVE');
  const currentCourses = useMemo(
    () =>
    myEnrollments.
    map((e) => courseSections.find((cs) => cs.id === e.courseSectionId)).
    filter((cs) => cs?.semesterId === activeSemester?.id).
    filter(Boolean),
    [myEnrollments, activeSemester]
  );
  const myGrades = useMemo(
    () => grades.filter((g) => g.studentId === currentUser?.id),
    [currentUser]
  );
  const completedCredits = useMemo(() => {
    return myGrades.
    filter((g) => g.gpaPoint !== undefined && g.gpaPoint > 0).
    reduce((sum, g) => {
      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      const subj = subjects.find((s) => s.id === cs?.subjectId);
      return sum + (subj?.credits ?? 0);
    }, 0);
  }, [myGrades]);
  const currentSemGPA = useMemo(() => {
    const currentGrades = myGrades.filter((g) => {
      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      return cs?.semesterId === activeSemester?.id && g.gpaPoint !== undefined;
    });
    if (currentGrades.length === 0) return null;
    const totalPoints = currentGrades.reduce((sum, g) => {
      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      const subj = subjects.find((s) => s.id === cs?.subjectId);
      return sum + (g.gpaPoint ?? 0) * (subj?.credits ?? 0);
    }, 0);
    const totalCredits = currentGrades.reduce((sum, g) => {
      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      const subj = subjects.find((s) => s.id === cs?.subjectId);
      return sum + (subj?.credits ?? 0);
    }, 0);
    return totalCredits > 0 ?
    Math.round(totalPoints / totalCredits * 100) / 100 :
    null;
  }, [myGrades, activeSemester]);
  const cumulativeGPA = useMemo(() => {
    const gradedItems = myGrades.filter((g) => g.gpaPoint !== undefined);
    if (gradedItems.length === 0) return null;
    const totalPoints = gradedItems.reduce((sum, g) => {
      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      const subj = subjects.find((s) => s.id === cs?.subjectId);
      return sum + (g.gpaPoint ?? 0) * (subj?.credits ?? 0);
    }, 0);
    const totalCredits = gradedItems.reduce((sum, g) => {
      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      const subj = subjects.find((s) => s.id === cs?.subjectId);
      return sum + (subj?.credits ?? 0);
    }, 0);
    return totalCredits > 0 ?
    Math.round(totalPoints / totalCredits * 100) / 100 :
    null;
  }, [myGrades]);
  const gpaHistory = [
  {
    name: 'HK1 22-23',
    GPA: 3.2
  },
  {
    name: 'HK2 22-23',
    GPA: 3.4
  },
  {
    name: 'HK1 23-24',
    GPA: cumulativeGPA ?? 3.5
  },
  {
    name: 'HK1 24-25',
    GPA: currentSemGPA ?? 3.3
  }];

  const creditProgress = Math.min(
    completedCredits / TOTAL_CREDITS_REQUIRED * 100,
    100
  );
  return (
    <Layout title="Dashboard - Sinh viên">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="GPA Học kỳ này"
            value={currentSemGPA !== null ? currentSemGPA.toFixed(2) : 'N/A'}
            change={
            currentSemGPA !== null && currentSemGPA >= 3.0 ?
            'Xuất sắc' :
            'Cần cải thiện'
            }
            changeType={
            currentSemGPA !== null && currentSemGPA >= 3.0 ? 'up' : 'down'
            }
            icon={<TrendingUpIcon className="w-5 h-5" />}
            color="sky" />

          <StatCard
            title="GPA Tích lũy"
            value={cumulativeGPA !== null ? cumulativeGPA.toFixed(2) : 'N/A'}
            subtitle="Toàn khóa học"
            icon={<AwardIcon className="w-5 h-5" />}
            color="blue" />

          <StatCard
            title="Tín chỉ tích lũy"
            value={`${completedCredits}/${TOTAL_CREDITS_REQUIRED}`}
            subtitle={`Còn ${TOTAL_CREDITS_REQUIRED - completedCredits} TC`}
            icon={<TargetIcon className="w-5 h-5" />}
            color="emerald" />

          <StatCard
            title="Môn đang học"
            value={currentCourses.length}
            subtitle={activeSemester?.name}
            icon={<BookOpenIcon className="w-5 h-5" />}
            color="amber" />

        </div>

        {/* Credit progress */}
        <Card
          title="Tiến độ tín chỉ"
          subtitle={`${completedCredits}/${TOTAL_CREDITS_REQUIRED} tín chỉ đã hoàn thành`}>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Hoàn thành</span>
              <span className="font-semibold text-slate-900">
                {Math.round(creditProgress)}%
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-700"
                style={{
                  width: `${creditProgress}%`
                }} />

            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>0 TC</span>
              <span>{TOTAL_CREDITS_REQUIRED} TC</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current courses */}
          <Card
            title="Môn học hiện tại"
            subtitle={activeSemester?.name}
            action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/student/registration')}>

                Xem thêm →
              </Button>
            }>

            <div className="space-y-3">
              {currentCourses.length === 0 ?
              <p className="text-sm text-slate-400 text-center py-4">
                  Chưa đăng ký môn học nào
                </p> :

              currentCourses.map((cs) => {
                if (!cs) return null;
                const subj = subjects.find((s) => s.id === cs.subjectId);
                return (
                  <div
                    key={cs.id}
                    className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">

                      <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                        <BookOpenIcon className="w-4 h-4 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {subj?.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {cs.schedule} · Phòng {cs.room}
                        </p>
                      </div>
                      <Badge variant="info">{subj?.credits} TC</Badge>
                    </div>);

              })
              }
            </div>
          </Card>

          {/* GPA trend */}
          <Card title="Xu hướng GPA" subtitle="4 học kỳ gần nhất">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={gpaHistory}
                margin={{
                  top: 5,
                  right: 10,
                  left: -20,
                  bottom: 5
                }}>

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 11,
                    fill: '#64748b'
                  }} />

                <YAxis
                  tick={{
                    fontSize: 12,
                    fill: '#64748b'
                  }}
                  domain={[2.5, 4.0]} />

                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                  formatter={(v) => [v, 'GPA']} />

                <Line
                  type="monotone"
                  dataKey="GPA"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{
                    fill: '#0284c7',
                    r: 5
                  }} />

              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Today's schedule */}
        <Card
          title="Lịch học hôm nay"
          icon={<ClockIcon className="w-4 h-4" />}
          action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/student/schedule')}>

              Xem TKB →
            </Button>
          }>

          <div className="space-y-2">
            {currentCourses.slice(0, 2).map((cs) => {
              if (!cs) return null;
              const subj = subjects.find((s) => s.id === cs.subjectId);
              return (
                <div
                  key={cs.id}
                  className="flex items-center gap-4 p-3 bg-sky-50 rounded-lg border border-sky-100">

                  <div className="text-center min-w-[60px]">
                    <p className="text-xs font-bold text-sky-700">
                      {cs.schedule.split('(')[1]?.replace(')', '') ??
                      'Tiết 1-3'}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {subj?.name}
                    </p>
                    <p className="text-xs text-slate-500">Phòng {cs.room}</p>
                  </div>
                </div>);

            })}
            {currentCourses.length === 0 &&
            <p className="text-sm text-slate-400 text-center py-4">
                Không có lịch học hôm nay
              </p>
            }
          </div>
        </Card>
      </div>
    </Layout>);

}