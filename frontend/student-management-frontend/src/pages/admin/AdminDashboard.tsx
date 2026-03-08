import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersIcon,
  GraduationCapIcon,
  BookOpenIcon,
  TrendingUpIcon,
  PlusIcon,
  UserPlusIcon,
  CalendarIcon,
  BarChart2Icon
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import { Layout } from '../../components/layout/Layout';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';

import type { User, Department, CourseSection, Semester, Grade } from '../../types';

import { getAdminUsersApi } from '../../services/adminUserService';
import { getDepartmentsApi } from '../../services/departmentService';
import { getCourseSectionsApi } from '../../services/courseSectionService';
import { getSemestersApi } from '../../services/semesterService';
import { getGradesApi } from '../../services/gradeService';

import { auditLogs } from '../../data/mockData';

const COLORS = ['#3b82f6', '#0d9488', '#f59e0b', '#8b5cf6', '#ef4444'];

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
        const [userData, deptData, sectionData, semesterData, gradeData] = await Promise.all([
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

  const stats = useMemo(() => {
    const students = users.filter((u) => u.role === 'STUDENT');
    const lecturers = users.filter((u) => u.role === 'LECTURER');

    const activeSemester = semesters.find((s) => s.status === 'ACTIVE');

    const openSections = courseSections.filter(
      (cs) => cs.semesterId === activeSemester?.id && cs.status !== 'CLOSED'
    );

    const passGrades = grades.filter(
      (g) => g.gpaPoint !== undefined && g.gpaPoint > 0
    );

    const passRate =
      grades.length > 0
        ? Math.round((passGrades.length / grades.length) * 100)
        : 0;

    return {
      students: students.length,
      lecturers: lecturers.length,
      openSections: openSections.length,
      passRate,
      activeSemesterName: activeSemester?.name ?? 'Hiện tại'
    };
  }, [users, semesters, courseSections, grades]);

  const deptChartData = useMemo(
    () =>
      departments.map((d) => ({
        name: d.code,
        'Sinh viên': d.studentCount
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

  const recentLogs = auditLogs.slice(0, 5);

  const actionBadge = (action: string) => {
    const map: Record<
      string,
      'success' | 'warning' | 'error' | 'info' | 'neutral'
    > = {
      CREATE: 'success',
      UPDATE: 'warning',
      DELETE: 'error',
      LOGIN: 'info',
      LOGOUT: 'neutral',
      EXPORT: 'neutral'
    };

    return <Badge variant={map[action] ?? 'neutral'}>{action}</Badge>;
  };

  if (loading) {
    return (
      <Layout title="Dashboard - Quản trị viên">
        <div className="p-6 text-sm text-slate-500">
          Đang tải dữ liệu dashboard...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard - Quản trị viên">
      <div className="space-y-8 max-w-[1400px] mx-auto">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        

          <div className="flex flex-wrap gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">

            <Button
              variant="primary"
              size="sm"
              icon={<UserPlusIcon className="w-4 h-4" />}
              onClick={() => navigate('/admin/users')}
            >
              Thêm tài khoản
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<PlusIcon className="w-4 h-4" />}
              onClick={() => navigate('/admin/semesters')}
            >
              Mở lớp học phần
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<CalendarIcon className="w-4 h-4" />}
              onClick={() => navigate('/admin/semesters')}
            >
              Quản lý học kỳ
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<BarChart2Icon className="w-4 h-4" />}
              onClick={() => navigate('/admin/audit')}
            >
              Xem Audit Log
            </Button>

          </div>
        </div>

        {/* STAT CARDS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

          <StatCard
            title="Tổng sinh viên"
            value={stats.students}
            change="+12 tháng này"
            changeType="up"
            icon={<GraduationCapIcon className="w-5 h-5" />}
            color="blue"
          />

          <StatCard
            title="Giảng viên"
            value={stats.lecturers}
            change="Đang hoạt động"
            changeType="neutral"
            icon={<UsersIcon className="w-5 h-5" />}
            color="teal"
          />

          <StatCard
            title="Môn học đang mở"
            value={stats.openSections}
            subtitle={stats.activeSemesterName}
            icon={<BookOpenIcon className="w-5 h-5" />}
            color="amber"
          />

          <StatCard
            title="Tỷ lệ đậu TB"
            value={`${stats.passRate}%`}
            change="+5% so với HK trước"
            changeType="up"
            icon={<TrendingUpIcon className="w-5 h-5" />}
            color="emerald"
          />

        </div>

        {/* CHARTS */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          <Card
            title="Sinh viên theo Khoa"
            subtitle="Phân bổ sinh viên hiện tại"
            className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >

            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={deptChartData}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />

                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                    fontSize: '12px'
                  }}
                />

                <Bar
                  dataKey="Sinh viên"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />

              </BarChart>
            </ResponsiveContainer>

          </Card>

          <Card
            title="Tỷ lệ đậu theo Học kỳ"
            subtitle="Xu hướng 5 học kỳ gần nhất"
            className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >

            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={passRateData}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />

                <YAxis domain={[70, 100]} />

                <Tooltip
                  formatter={(v) => [`${v}%`, 'Tỷ lệ đậu']}
                />

                <Line
                  type="monotone"
                  dataKey="Tỷ lệ đậu"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />

              </LineChart>
            </ResponsiveContainer>

          </Card>

        </div>

        {/* PIE + AUDIT */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          <Card title="Phân bố theo Năm học">

            <ResponsiveContainer width="100%" height={220}>
              <PieChart>

                <Pie
                  data={yearDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {yearDistribution.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
                <Legend />

              </PieChart>
            </ResponsiveContainer>

          </Card>

          <Card
            title="Hoạt động gần đây"
            subtitle="5 hành động mới nhất"
            className="xl:col-span-2"
          >

            <div className="space-y-2 max-h-[260px] overflow-auto pr-1">

              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition"
                >

                  {actionBadge(log.action)}

                  <div className="flex-1 min-w-0">

                    <p className="text-xs font-medium text-slate-800 truncate">
                      {log.detail}
                    </p>

                    <p className="text-xs text-slate-500 mt-0.5">
                      {log.userName} · {log.timestamp.split(' ')[0]}
                    </p>

                  </div>

                </div>
              ))}

            </div>

          </Card>

        </div>

      </div>
    </Layout>
  );
}