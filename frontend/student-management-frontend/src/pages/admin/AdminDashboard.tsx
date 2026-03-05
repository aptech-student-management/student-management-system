import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersIcon,
  GraduationCapIcon,
  BookOpenIcon,
  TrendingUpIcon,
  PlusIcon,
  UserPlusIcon,
  CalendarIcon,
  BarChart2Icon } from
'lucide-react';
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
  Legend } from
'recharts';
import { Layout } from '../../components/layout/Layout';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  users,
  departments,
  courseSections,
  semesters,
  grades,
  auditLogs } from
'../../data/mockData';
const COLORS = ['#3b82f6', '#0d9488', '#f59e0b', '#8b5cf6', '#ef4444'];
export function AdminDashboard() {
  const navigate = useNavigate();
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
    grades.length > 0 ?
    Math.round(passGrades.length / grades.length * 100) :
    0;
    return {
      students: students.length,
      lecturers: lecturers.length,
      openSections: openSections.length,
      passRate
    };
  }, []);
  const deptChartData = useMemo(
    () =>
    departments.map((d) => ({
      name: d.code,
      'Sinh viên': d.studentCount
    })),
    []
  );
  const passRateData = useMemo(
    () => [
    {
      name: 'HK1 22-23',
      'Tỷ lệ đậu': 82
    },
    {
      name: 'HK2 22-23',
      'Tỷ lệ đậu': 78
    },
    {
      name: 'HK1 23-24',
      'Tỷ lệ đậu': 85
    },
    {
      name: 'HK2 23-24',
      'Tỷ lệ đậu': 80
    },
    {
      name: 'HK1 24-25',
      'Tỷ lệ đậu': 87
    }],

    []
  );
  const yearDistribution = useMemo(
    () => [
    {
      name: 'Năm 1',
      value: 320
    },
    {
      name: 'Năm 2',
      value: 280
    },
    {
      name: 'Năm 3',
      value: 260
    },
    {
      name: 'Năm 4',
      value: 200
    },
    {
      name: 'Năm 5+',
      value: 120
    }],

    []
  );
  const recentLogs = auditLogs.slice(0, 5);
  const actionBadge = (action: string) => {
    const map: Record<
      string,
      'success' | 'warning' | 'error' | 'info' | 'neutral'> =
    {
      CREATE: 'success',
      UPDATE: 'warning',
      DELETE: 'error',
      LOGIN: 'info',
      LOGOUT: 'neutral',
      EXPORT: 'purple' as 'neutral'
    };
    return <Badge variant={map[action] ?? 'neutral'}>{action}</Badge>;
  };
  return (
    <Layout title="Dashboard - Quản trị viên">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Tổng sinh viên"
            value={stats.students}
            change="+12 tháng này"
            changeType="up"
            icon={<GraduationCapIcon className="w-5 h-5" />}
            color="blue" />

          <StatCard
            title="Giảng viên"
            value={stats.lecturers}
            change="Đang hoạt động"
            changeType="neutral"
            icon={<UsersIcon className="w-5 h-5" />}
            color="teal" />

          <StatCard
            title="Môn học đang mở"
            value={stats.openSections}
            subtitle="HK1 2024-2025"
            icon={<BookOpenIcon className="w-5 h-5" />}
            color="amber" />

          <StatCard
            title="Tỷ lệ đậu TB"
            value={`${stats.passRate}%`}
            change="+5% so với HK trước"
            changeType="up"
            icon={<TrendingUpIcon className="w-5 h-5" />}
            color="emerald" />

        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            size="sm"
            icon={<UserPlusIcon className="w-4 h-4" />}
            onClick={() => navigate('/admin/users')}>

            Thêm tài khoản
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={() => navigate('/admin/semesters')}>

            Mở lớp học phần
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<CalendarIcon className="w-4 h-4" />}
            onClick={() => navigate('/admin/semesters')}>

            Quản lý học kỳ
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<BarChart2Icon className="w-4 h-4" />}
            onClick={() => navigate('/admin/audit')}>

            Xem Audit Log
          </Button>
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="Sinh viên theo Khoa"
            subtitle="Phân bổ sinh viên hiện tại">

            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={deptChartData}
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
                    fontSize: 12,
                    fill: '#64748b'
                  }} />

                <YAxis
                  tick={{
                    fontSize: 12,
                    fill: '#64748b'
                  }} />

                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }} />

                <Bar dataKey="Sinh viên" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card
            title="Tỷ lệ đậu theo Học kỳ"
            subtitle="Xu hướng 5 học kỳ gần nhất">

            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={passRateData}
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
                  domain={[70, 100]} />

                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                  formatter={(v) => [`${v}%`, 'Tỷ lệ đậu']} />

                <Line
                  type="monotone"
                  dataKey="Tỷ lệ đậu"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{
                    fill: '#0d9488',
                    r: 4
                  }} />

              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts row 2 + recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Phân bố theo Năm học" subtitle="Tổng sinh viên theo năm">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={yearDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value">

                  {yearDistribution.map((_, index) =>
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]} />

                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }} />

                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{
                    fontSize: '11px'
                  }} />

              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card
            title="Hoạt động gần đây"
            subtitle="5 hành động mới nhất"
            className="lg:col-span-2">

            <div className="space-y-3">
              {recentLogs.map((log) =>
              <div
                key={log.id}
                className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">

                  <div className="flex-shrink-0 mt-0.5">
                    {actionBadge(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {log.detail}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {log.userName} · {log.timestamp.split(' ')[0]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>);

}