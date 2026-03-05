import React, { useMemo, useState } from 'react';
import {
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
  MapPinIcon,
  XIcon } from
'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import {
  courseSections,
  subjects,
  classes,
  semesters,
  enrollments,
  users } from
'../../data/mockData';
export function MyClasses() {
  const { currentUser } = useAuth();
  const [filterSemester, setFilterSemester] = useState(
    semesters.find((s) => s.status === 'ACTIVE')?.id ?? ''
  );
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const myClasses = useMemo(
    () =>
    courseSections.filter(
      (cs) =>
      cs.lecturerId === currentUser?.id && (
      filterSemester ? cs.semesterId === filterSemester : true)
    ),
    [currentUser, filterSemester]
  );
  const selectedSectionData = selectedSection ?
  courseSections.find((cs) => cs.id === selectedSection) :
  null;
  const sectionStudents = useMemo(() => {
    if (!selectedSection) return [];
    return enrollments.
    filter(
      (e) => e.courseSectionId === selectedSection && e.status === 'ENROLLED'
    ).
    map((e) => users.find((u) => u.id === e.studentId)).
    filter(Boolean);
  }, [selectedSection]);
  return (
    <Layout title="Lớp học của tôi">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-48">
            <Select
              options={semesters.map((s) => ({
                value: s.id,
                label: s.name
              }))}
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              placeholder="Tất cả học kỳ" />

          </div>
          <p className="text-sm text-slate-500">
            {myClasses.length} lớp học phần
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myClasses.map((cs) => {
            const subj = subjects.find((s) => s.id === cs.subjectId);
            const cls = classes.find((c) => c.id === cs.classId);
            const sem = semesters.find((s) => s.id === cs.semesterId);
            return (
              <div
                key={cs.id}
                className="bg-white rounded-xl border border-slate-200 p-5 cursor-pointer hover:border-teal-300 hover:shadow-card-hover transition-all"
                onClick={() => setSelectedSection(cs.id)}>

                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                    <BookOpenIcon className="w-5 h-5 text-teal-600" />
                  </div>
                  <Badge
                    variant={
                    cs.status === 'OPEN' ?
                    'success' :
                    cs.status === 'FULL' ?
                    'warning' :
                    'neutral'
                    }
                    dot>

                    {cs.status === 'OPEN' ?
                    'Mở' :
                    cs.status === 'FULL' ?
                    'Đầy' :
                    'Đóng'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  {subj?.name}
                </h3>
                <p className="text-xs text-slate-500 mb-1">
                  {subj?.code} · {subj?.credits} tín chỉ
                </p>
                <p className="text-xs text-slate-400 mb-4">{sem?.name}</p>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cls?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cs.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Phòng {cs.room}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Sĩ số</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {cs.enrolledCount}/{cs.maxStudents}
                  </span>
                </div>
              </div>);

          })}
          {myClasses.length === 0 &&
          <div className="col-span-3 text-center py-16 text-slate-400">
              <BookOpenIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Không có lớp học nào trong học kỳ này</p>
            </div>
          }
        </div>
      </div>

      {/* Student list modal */}
      <Modal
        isOpen={!!selectedSection}
        onClose={() => setSelectedSection(null)}
        title={`Danh sách sinh viên — ${subjects.find((s) => s.id === selectedSectionData?.subjectId)?.name ?? ''}`}
        size="lg">

        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            {sectionStudents.length} sinh viên đã đăng ký
          </p>
          {sectionStudents.map((student, idx) => {
            if (!student) return null;
            return (
              <div
                key={student.id}
                className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">

                <span className="text-xs text-slate-400 w-6 text-right">
                  {idx + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-700 flex-shrink-0">
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
                  {classes.find((c) => c.id === student.classId)?.name ?? '—'}
                </Badge>
              </div>);

          })}
        </div>
      </Modal>
    </Layout>);

}