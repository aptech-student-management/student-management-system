import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpenIcon,
  CheckCircleIcon,
  AlertTriangleIcon } from
'lucide-react';
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

  const d = new Date(date);

  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh"
  });
};
export function CourseRegistration() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
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
        showToast('Không thể tải dữ liệu đăng ký môn', 'error');
      }
    };

    void loadData();
  }, [showToast]);

  const activeSemester = semesters.find((s) => s.status === 'ACTIVE');
  const availableSections = useMemo(
    () => courseSections.filter((cs) => cs.semesterId === activeSemester?.id),
    [courseSections, activeSemester]
  );
  const myEnrollments = useMemo(
    () =>
    enrollmentList.filter(
      (e) => e.studentId === currentUser?.studentId && e.status === 'ENROLLED'
    ),
    [enrollmentList, currentUser]
  );
  const myEnrolledSectionIds = new Set(
    myEnrollments.map((e) => e.courseSectionId)
  );
  const isEnrolled = (sectionId: string) => myEnrolledSectionIds.has(sectionId);
  const hasConflict = (section: CourseSection) => {
    if (isEnrolled(section.id)) return false;
    const enrolledSections = myEnrollments.
    map((e) => courseSections.find((cs) => cs.id === e.courseSectionId)).
    filter(Boolean);
    return enrolledSections.some((cs) => cs?.schedule === section.schedule);
  };

  const applySectionEnrollmentDelta = (sectionId: string, delta: number) => {
    setCourseSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;

        const nextCount = Math.max(0, section.enrolledCount + delta);
        const isFull = nextCount >= section.maxStudents;

        return {
          ...section,
          enrolledCount: nextCount,
          status: section.status === 'CLOSED' ? section.status : isFull ? 'FULL' : 'OPEN'
        };
      })
    );
  };

  const handleRegister = async (sectionId: string) => {
    const section = courseSections.find((cs) => cs.id === sectionId);
    if (!section || !currentUser) return;
    if (hasConflict(section)) {
      showToast('Trùng lịch học! Không thể đăng ký môn này.', 'error');
      return;
    }

    try {
      setLoading(sectionId);
      const saved = await createEnrollmentApi({
        studentId: currentUser.studentId ?? '',
        courseSectionId: sectionId,
        enrolledAt: new Date().toISOString().split('T')[0],
        status: 'ENROLLED'
      });

      setEnrollmentList((prev) => {
        const idx = prev.findIndex((e) => e.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev.filter((e) => !(e.studentId === saved.studentId && e.courseSectionId === saved.courseSectionId)), saved];
      });
      applySectionEnrollmentDelta(sectionId, 1);

      const subj = subjects.find((s) => s.id === section.subjectId);
      showToast(`Đăng ký môn "${subj?.name}" thành công!`, 'success');
    } catch {
      showToast('Đăng ký môn thất bại', 'error');
    } finally {
      setLoading(null);
    }
  };
  const handleDrop = async (sectionId: string) => {
    const target = enrollmentList.find(
      (e) =>
        e.studentId === currentUser?.studentId &&
        e.courseSectionId === sectionId &&
        e.status === 'ENROLLED'
    );

    if (!target) return;

    try {
      setLoading(sectionId);
      const updated = await updateEnrollmentApi(target.id, { status: 'DROPPED' });

      setEnrollmentList((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
      applySectionEnrollmentDelta(sectionId, -1);

      const section = courseSections.find((cs) => cs.id === sectionId);
      const subj = subjects.find((s) => s.id === section?.subjectId);
      showToast(`Đã hủy đăng ký môn "${subj?.name}"`, 'warning');
    } catch {
      showToast('Hủy đăng ký thất bại', 'error');
    } finally {
      setLoading(null);
    }
  };
  const getLecturerName = (id: string) =>
  users.find((u) => u.id === id)?.name ?? '—';
  const sectionStatusBadge = (section: CourseSection) => {
    if (section.status === 'FULL')
    return (
      <Badge variant="error" dot>
          Đầy
        </Badge>);

    if (section.status === 'CLOSED')
    return (
      <Badge variant="neutral" dot>
          Đóng
        </Badge>);

    return (
      <Badge variant="success" dot>
        Mở
      </Badge>);

  };
  const totalRegisteredCredits = myEnrollments.reduce((sum, e) => {
    const cs = courseSections.find((c) => c.id === e.courseSectionId);
    const subj = subjects.find((s) => s.id === cs?.subjectId);
    return sum + (subj?.credits ?? 0);
  }, 0);
  return (
    <Layout title="Đăng ký Môn học">
      <div className="space-y-6">
        {/* Semester info */}
       <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3">
  <BookOpenIcon className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />

  <div className="space-y-1">
    <p className="text-sm font-semibold text-sky-900">
      {activeSemester?.name ?? "Không có học kỳ đang mở"}
    </p>

    <p className="text-xs text-sky-700">
      Thời gian đăng ký:{" "}
      <span className="font-medium">
        {formatVNDate(activeSemester?.startDate)}
      </span>{" "}
      —{" "}
      <span className="font-medium">
        {formatVNDate(activeSemester?.endDate)}
      </span>
    </p>

    <p className="text-xs text-sky-700">
      Đã đăng ký:{" "}
      <strong>
        {myEnrollments.length} môn ({totalRegisteredCredits} tín chỉ)
      </strong>
    </p>
  </div>
</div>

        {/* Available courses */}
        <Card
          title="Danh sách môn học có thể đăng ký"
          subtitle={`${availableSections.length} lớp học phần`}
          padding={false}>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Môn học
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    TC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Giảng viên
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Lịch học
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Phòng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Sĩ số
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {availableSections.map((cs) => {
                  const subj = subjects.find((s) => s.id === cs.subjectId);
                  const enrolled = isEnrolled(cs.id);
                  const conflict = hasConflict(cs);
                  const full =
                  cs.status === 'FULL' || cs.enrolledCount >= cs.maxStudents;
                  const closed = cs.status === 'CLOSED';
                  return (
                    <tr
                      key={cs.id}
                      className={`border-b border-slate-100 transition-colors ${enrolled ? 'bg-sky-50/50' : 'hover:bg-slate-50/70'}`}>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {enrolled &&
                          <CheckCircleIcon className="w-4 h-4 text-sky-500 flex-shrink-0" />
                          }
                          {conflict && !enrolled &&
                          <AlertTriangleIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          }
                          <div>
                            <p className="font-medium text-slate-900">
                              {subj?.name}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">
                              {subj?.code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info">{subj?.credits}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {getLecturerName(cs.lecturerId)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {cs.schedule}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                          {cs.room}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-medium ${cs.enrolledCount >= cs.maxStudents ? 'text-red-600' : 'text-slate-700'}`}>

                          {cs.enrolledCount}/{cs.maxStudents}
                        </span>
                      </td>
                      <td className="px-4 py-3">{sectionStatusBadge(cs)}</td>
                      <td className="px-4 py-3">
                        {enrolled ?
                        <Button
                          variant="danger"
                          size="sm"
                          loading={loading === cs.id}
                          onClick={() => handleDrop(cs.id)}>

                            Hủy đăng ký
                          </Button> :

                        <Button
                          variant="primary"
                          size="sm"
                          loading={loading === cs.id}
                          disabled={full || closed || conflict}
                          onClick={() => handleRegister(cs.id)}
                          className="bg-sky-600 hover:bg-sky-700">

                            {conflict ? 'Trùng lịch' : full ? 'Đầy' : 'Đăng ký'}
                          </Button>
                        }
                      </td>
                    </tr>);

                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* My registered courses */}
        {myEnrollments.length > 0 &&
        <Card
          title="Môn học đã đăng ký"
          subtitle={`${myEnrollments.length} môn · ${totalRegisteredCredits} tín chỉ`}>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myEnrollments.map((e) => {
              const cs = courseSections.find(
                (c) => c.id === e.courseSectionId
              );
              const subj = subjects.find((s) => s.id === cs?.subjectId);
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 p-3 bg-sky-50 rounded-lg border border-sky-100">

                    <CheckCircleIcon className="w-5 h-5 text-sky-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {subj?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {cs?.schedule} · {subj?.credits} TC
                      </p>
                    </div>
                  </div>);

            })}
            </div>
          </Card>
        }
      </div>
    </Layout>);

}
