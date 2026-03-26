// 🚀 PRODUCTION SaaS UI + FIXED LOGIC (state update restored)
import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpenIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  SearchIcon
} from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Enrollment, CourseSection, Semester, Subject, User } from '../../types';
import { getCourseSectionsApi } from '../../services/courseSectionService';
import { getSubjectsApi } from '../../services/subjectService';
import { getSemestersApi } from '../../services/semesterService';
import {
  createEnrollmentApi,
  getEnrollmentsApi,
  updateEnrollmentApi
} from '../../services/enrollmentService';
import { getLecturersApi } from '../../services/userService';

const formatVNDate = (date?: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN");
};

export function CourseRegistration() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [enrollmentList, setEnrollmentList] = useState<Enrollment[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sectionData, subjectData, semesterData, enrollmentData, userData] = await Promise.all([
          getCourseSectionsApi(),
          getSubjectsApi(),
          getSemestersApi(),
          getEnrollmentsApi(),
          getLecturersApi()
        ]);

        setCourseSections(sectionData);
        setSubjects(subjectData);
        setSemesters(semesterData);
        setEnrollmentList(enrollmentData);
        setUsers(userData);
      } catch {
        showToast('Không thể tải dữ liệu', 'error');
      }
    };

    void loadData();
  }, [showToast]);

  const activeSemester = semesters.find((s) => s.status === 'ACTIVE');

  const availableSections = useMemo(() => {
    return courseSections
      .filter((cs) => cs.semesterId === activeSemester?.id)
      .filter((cs) => {
        const subj = subjects.find((s) => s.id === cs.subjectId);
        return (
          subj?.name.toLowerCase().includes(search.toLowerCase()) ||
          subj?.code.toLowerCase().includes(search.toLowerCase())
        );
      });
  }, [courseSections, activeSemester, search, subjects]);

  const myEnrollments = useMemo(() =>
    enrollmentList.filter(
      (e) => e.studentId === currentUser?.studentId && e.status === 'ENROLLED'
    ),
    [enrollmentList, currentUser]
  );

  const isEnrolled = (id: string) =>
    myEnrollments.some((e) => e.courseSectionId === id);

  const hasConflict = (section: CourseSection) => {
    return myEnrollments.some((e) => {
      const cs = courseSections.find((c) => c.id === e.courseSectionId);
      return cs?.schedule === section.schedule;
    });
  };

  const applyDelta = (sectionId: string, delta: number) => {
    setCourseSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        enrolledCount: Math.max(0, s.enrolledCount + delta)
      };
    }));
  };

  const handleRegister = async (id: string) => {
    try {
      setLoading(id);

      const saved = await createEnrollmentApi({
        studentId: currentUser?.studentId ?? '',
        courseSectionId: id,
        enrolledAt: new Date().toISOString(),
        status: 'ENROLLED'
      });

      setEnrollmentList(prev => [...prev, saved]);
      applyDelta(id, 1);

      showToast('Đăng ký thành công', 'success');
    } catch {
      showToast('Lỗi đăng ký', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleDrop = async (id: string) => {
    const target = enrollmentList.find(
      e => e.courseSectionId === id && e.studentId === currentUser?.studentId
    );

    if (!target) return;

    try {
      setLoading(id);

      await updateEnrollmentApi(target.id, { status: 'DROPPED' });

      setEnrollmentList(prev => prev.map(e =>
        e.id === target.id ? { ...e, status: 'DROPPED' } : e
      ));

      applyDelta(id, -1);

      showToast('Đã hủy đăng ký', 'warning');
    } catch {
      showToast('Lỗi hủy', 'error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Layout title="Đăng ký Môn học">
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl shadow">
          <p className="text-xl font-bold dark:text-white">
            {activeSemester?.name}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {formatVNDate(activeSemester?.startDate)} → {formatVNDate(activeSemester?.endDate)}
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl px-4 py-2 shadow-sm">
          <SearchIcon className="w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm môn học..."
            className="bg-transparent outline-none flex-1 text-sm dark:text-white"
          />
        </div>

        {/* Table */}
        <Card title="Danh sách lớp học">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="p-3 text-left">Môn</th>
                  <th>TC</th>
                  <th>GV</th>
                  <th>Lịch</th>
                  <th>Sĩ số</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {availableSections.map((cs) => {
                  const subj = subjects.find((s) => s.id === cs.subjectId);
                  const enrolled = isEnrolled(cs.id);
                  const percent = (cs.enrolledCount / cs.maxStudents) * 100;

                  return (
                    <tr
                      key={cs.id}
                      className={`border-b dark:border-slate-700 transition ${
                        enrolled ? 'bg-sky-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >

                      <td className="p-3">
                        <p className="font-medium dark:text-white">{subj?.name}</p>
                        <p className="text-xs text-slate-500">{subj?.code}</p>
                      </td>

                      <td className="text-center">{subj?.credits}</td>

                      <td className="text-center text-xs">
                        {users.find(u => u.id === cs.lecturerId)?.name}
                      </td>

                      <td className="text-center text-xs">{cs.schedule}</td>

                      <td className="text-center">
                        <div className="w-24 mx-auto">
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded">
                            <div
                              style={{ width: `${percent}%` }}
                              className="h-2 bg-sky-500 rounded"
                            />
                          </div>
                          <p className="text-xs mt-1">
                            {cs.enrolledCount}/{cs.maxStudents}
                          </p>
                        </div>
                      </td>

                      <td className="text-center">
                        {enrolled ? (
                          <Button size="sm" variant="danger" loading={loading === cs.id} onClick={() => handleDrop(cs.id)}>
                            Hủy
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            loading={loading === cs.id}
                            disabled={hasConflict(cs)}
                            onClick={() => handleRegister(cs.id)}
                          >
                            {hasConflict(cs) ? 'Trùng' : 'Đăng ký'}
                          </Button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
