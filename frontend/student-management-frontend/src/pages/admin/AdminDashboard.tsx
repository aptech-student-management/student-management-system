import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpenIcon,
  CalendarIcon,
  GraduationCapIcon,
  PlusIcon,
  TrendingUpIcon,
  UserPlusIcon,
  UsersIcon
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { DashboardHero } from '../../components/ui/DashboardHero';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../contexts/ToastContext';

import type { CourseSection, Department, Grade, Semester, User } from '../../types';
import { getAdminUsersApi } from '../../services/adminUserService';
import { getCourseSectionsApi } from '../../services/courseSectionService';
import { getDepartmentsApi } from '../../services/departmentService';
import { getGradesApi } from '../../services/gradeService';
import { getSemestersApi } from '../../services/semesterService';

const PIE_COLORS = ['#a3e635', '#14b8a6', '#60a5fa', '#f59e0b', '#64748b'];
const chartGridColor = 'var(--chart-grid)';
const chartAxisColor = 'var(--chart-axis)';
const tooltipStyle = {
  borderRadius: '18px',
  border: '1px solid var(--chart-tooltip-border)',
  background: 'var(--chart-tooltip-bg)',
  boxShadow: '0 22px 45px -28px rgba(15, 23, 42, 0.65)',
  fontSize: '12px'
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, deptData, sectionData, semesterData, gradeData] =
          await Promise.all([
            getAdminUsersApi(),
            getDepartmentsApi(),
            getCourseSectionsApi(),
            getSemestersApi(),
            getGradesApi()
          ]);

        setUsers(userData);
        setDepartments(deptData);
        setCourseSections(sectionData);
        setSemesters(semesterData);
        setGrades(gradeData);
      } catch {
        showToast('Không thể tải dữ liệu dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [showToast]);

  const activeSemester = useMemo(
    () => semesters.find((semester) => semester.status === 'ACTIVE'),
    [semesters]
  );

  const stats = useMemo(() => {
    const students = users.filter((user) => user.role === 'STUDENT');
    const lecturers = users.filter((user) => user.role === 'LECTURER');

    const openSections = courseSections.filter(
      (section) => section.semesterId === activeSemester?.id && section.status !== 'CLOSED'
    );

    const passGrades = grades.filter((grade) => grade.gpaPoint !== undefined && grade.gpaPoint > 0);
    const passRate = grades.length > 0 ? Math.round((passGrades.length / grades.length) * 100) : 0;
    const avgStudentsPerDept =
      departments.length > 0 ? Math.round(students.length / departments.length) : 0;

    return {
      students: students.length,
      lecturers: lecturers.length,
      openSections: openSections.length,
      passRate,
      avgStudentsPerDept,
      activeSemesterName: activeSemester?.name ?? 'Chưa mở học kỳ'
    };
  }, [activeSemester?.id, activeSemester?.name, courseSections, departments.length, grades, users]);

  const deptChartData = useMemo(
    () =>
      departments.map((department) => ({
        name: department.code,
        'Sinh viên': department.studentCount
      })),
    [departments]
  );

  const topDepartments = useMemo(
    () =>
      [...departments]
        .sort((a, b) => b.studentCount - a.studentCount)
        .slice(0, 4)
        .map((department) => ({
          name: department.name,
          code: department.code,
          studentCount: department.studentCount
        })),
    [departments]
  );

  const passRateData = [
    { name: 'HK1 22-23', 'Tỷ lệ đậu': 82 },
    { name: 'HK2 22-23', 'Tỷ lệ đậu': 78 },
    { name: 'HK1 23-24', 'Tỷ lệ đậu': 85 },
    { name: 'HK2 23-24', 'Tỷ lệ đậu': 80 },
    { name: 'HK1 24-25', 'Tỷ lệ đậu': 87 }
  ];

  const yearDistribution = [
    { name: 'Năm 1', value: 320 },
    { name: 'Năm 2', value: 280 },
    { name: 'Năm 3', value: 260 },
    { name: 'Năm 4', value: 200 },
    { name: 'Năm 5+', value: 120 }
  ];

  if (loading) {
    return (
      <Layout title="Dashboard - Quản trị viên">
        <div className="rounded-[28px] border border-slate-200/70 bg-white/[0.86] p-6 text-sm text-slate-500 dark:border-white/[0.06] dark:bg-[#070b10]/90 dark:text-slate-400">
          Đang tải dữ liệu dashboard...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard - Quản trị viên">
      <div className="space-y-6">
        <DashboardHero
          eyebrow="Admin Control"
          title="Toàn cảnh hệ thống đào tạo"
          description="Theo dõi sức khỏe vận hành, phân bổ sinh viên và học kỳ hiện tại trong một giao diện đậm chất tối giản hơn, dễ nhìn hơn khi dùng lâu."
          accent="lime"
          stats={[
            { label: 'Học kỳ', value: stats.activeSemesterName },
            { label: 'Tài khoản', value: `${users.length}` },
            { label: 'Khoa', value: `${departments.length}` },
            { label: 'Tỷ lệ đậu', value: `${stats.passRate}%` }
          ]}
          actions={
            <>
              <Button
                variant="primary"
                size="sm"
                icon={<UserPlusIcon className="h-4 w-4" />}
                onClick={() => navigate('/admin/users')}
              >
                Thêm tài khoản
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<PlusIcon className="h-4 w-4" />}
                onClick={() => navigate('/admin/semesters')}
              >
                Mở lớp học phần
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<CalendarIcon className="h-4 w-4" />}
                onClick={() => navigate('/admin/semesters')}
              >
                Quản lý học kỳ
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Tổng sinh viên"
            value={stats.students}
            change="+12 tháng này"
            changeType="up"
            icon={<GraduationCapIcon className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Giảng viên"
            value={stats.lecturers}
            change="Đang hoạt động"
            changeType="neutral"
            icon={<UsersIcon className="h-5 w-5" />}
            color="teal"
          />
          <StatCard
            title="Lớp đang mở"
            value={stats.openSections}
            subtitle={stats.activeSemesterName}
            icon={<BookOpenIcon className="h-5 w-5" />}
            color="amber"
          />
          <StatCard
            title="Bình quân mỗi khoa"
            value={stats.avgStudentsPerDept}
            subtitle="Sinh viên / khoa"
            icon={<TrendingUpIcon className="h-5 w-5" />}
            color="emerald"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.35fr_0.85fr]">
          <Card
            title="Sinh viên theo khoa"
            subtitle="Phân bổ hiện tại theo từng đơn vị đào tạo"
            variant="dashboard"
          >
            {deptChartData.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-400 dark:text-slate-500">
                Chưa có dữ liệu khoa để hiển thị.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={deptChartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={chartGridColor} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: chartAxisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: chartAxisColor }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
                  <Bar dataKey="Sinh viên" fill="#63B069" radius={[14, 14, 4, 4]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card
            title="Tín hiệu vận hành"
            subtitle="Những con số cần xem nhanh mỗi ngày"
            variant="dashboard"
          >
            <div className="grid gap-3">
              <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Học kỳ đang chạy
                </p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-slate-50">
                  {stats.activeSemesterName}
                </p>
              </div>

              <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Tổng bản ghi điểm
                </p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-slate-50">
                  {grades.length}
                </p>
              </div>

              <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Khoa nổi bật
                </p>
                <div className="mt-3 space-y-3">
                  {topDepartments.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500">Chưa có dữ liệu khoa.</p>
                  ) : (
                    topDepartments.map((department) => (
                      <div key={department.code} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {department.code}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {department.name}
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-slate-300">
                          {department.studentCount}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card
            title="Tỷ lệ đậu theo học kỳ"
            subtitle="Đường xu hướng 5 học kỳ gần nhất"
            variant="dashboard"
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={passRateData} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid stroke={chartGridColor} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartAxisColor }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[70, 100]}
                  tick={{ fontSize: 12, fill: chartAxisColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, 'Tỷ lệ đậu']} />
                <Line
                  type="monotone"
                  dataKey="Tỷ lệ đậu"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 0, fill: '#86efac' }}
                  activeDot={{ r: 5, fill: '#bef264' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card
            title="Phân bố theo năm học"
            subtitle="Tỷ trọng sinh viên theo tiến độ đào tạo"
            variant="dashboard"
          >
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={yearDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {yearDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {yearDistribution.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-[22px] border border-slate-200/70 bg-slate-50/70 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
