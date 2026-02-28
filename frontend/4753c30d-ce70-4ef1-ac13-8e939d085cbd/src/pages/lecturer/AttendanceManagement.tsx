import React, { useMemo, useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SaveIcon,
  CheckSquareIcon } from
'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  courseSections,
  subjects,
  enrollments,
  users,
  attendanceRecords as initialAttendance } from
'../../data/mockData';
import type { Attendance } from '../../types';
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';
export function AttendanceManagement() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceStatus>>(
    {});
  const [saving, setSaving] = useState(false);
  const [savedRecords, setSavedRecords] =
  useState<Attendance[]>(initialAttendance);
  const myClasses = useMemo(
    () => courseSections.filter((cs) => cs.lecturerId === currentUser?.id),
    [currentUser]
  );
  const sectionStudents = useMemo(() => {
    if (!selectedSection) return [];
    return enrollments.
    filter(
      (e) => e.courseSectionId === selectedSection && e.status === 'ENROLLED'
    ).
    map((e) => users.find((u) => u.id === e.studentId)).
    filter(Boolean);
  }, [selectedSection]);
  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
    const existing: Record<string, AttendanceStatus> = {};
    savedRecords.
    filter((a) => a.courseSectionId === sectionId && a.date === selectedDate).
    forEach((a) => {
      existing[a.studentId] = a.status;
    });
    setAttendanceMap(existing);
  };
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (!selectedSection) return;
    const existing: Record<string, AttendanceStatus> = {};
    savedRecords.
    filter((a) => a.courseSectionId === selectedSection && a.date === date).
    forEach((a) => {
      existing[a.studentId] = a.status;
    });
    setAttendanceMap(existing);
  };
  const markAll = (status: AttendanceStatus) => {
    const newMap: Record<string, AttendanceStatus> = {};
    sectionStudents.forEach((s) => {
      if (s) newMap[s.id] = status;
    });
    setAttendanceMap(newMap);
  };
  const handleSave = async () => {
    if (!selectedSection || !selectedDate) {
      showToast('Vui lòng chọn lớp và ngày', 'warning');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    const newRecords: Attendance[] = sectionStudents.
    filter(Boolean).
    map((s) => ({
      id: `att-${s!.id}-${selectedSection}-${selectedDate}`,
      studentId: s!.id,
      courseSectionId: selectedSection,
      date: selectedDate,
      status: attendanceMap[s!.id] ?? 'ABSENT'
    }));
    setSavedRecords((prev) => {
      const filtered = prev.filter(
        (a) =>
        !(a.courseSectionId === selectedSection && a.date === selectedDate)
      );
      return [...filtered, ...newRecords];
    });
    showToast('Lưu điểm danh thành công!', 'success');
    setSaving(false);
  };
  const historyDates = useMemo(() => {
    if (!selectedSection) return [];
    const dates = [
    ...new Set(
      savedRecords.
      filter((a) => a.courseSectionId === selectedSection).
      map((a) => a.date)
    )].

    sort().
    reverse();
    return dates.slice(0, 5).map((date) => {
      const records = savedRecords.filter(
        (a) => a.courseSectionId === selectedSection && a.date === date
      );
      return {
        date,
        present: records.filter((a) => a.status === 'PRESENT').length,
        absent: records.filter((a) => a.status === 'ABSENT').length,
        late: records.filter((a) => a.status === 'LATE').length
      };
    });
  }, [selectedSection, savedRecords]);
  const statusConfig: Record<
    AttendanceStatus,
    {
      label: string;
      color: string;
      icon: React.ReactNode;
    }> =
  {
    PRESENT: {
      label: 'Có mặt',
      color: 'bg-emerald-50 border-emerald-300 text-emerald-700',
      icon: <CheckCircleIcon className="w-4 h-4" />
    },
    ABSENT: {
      label: 'Vắng',
      color: 'bg-red-50 border-red-300 text-red-700',
      icon: <XCircleIcon className="w-4 h-4" />
    },
    LATE: {
      label: 'Trễ',
      color: 'bg-amber-50 border-amber-300 text-amber-700',
      icon: <ClockIcon className="w-4 h-4" />
    }
  };
  return (
    <Layout title="Quản lý Điểm danh">
      <div className="space-y-6">
        {/* Controls */}
        <Card>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select
                label="Lớp học phần"
                options={myClasses.map((cs) => {
                  const subj = subjects.find((s) => s.id === cs.subjectId);
                  return {
                    value: cs.id,
                    label: `${subj?.name} (${cs.schedule})`
                  };
                })}
                value={selectedSection}
                onChange={(e) => handleSectionChange(e.target.value)}
                placeholder="Chọn lớp học phần" />

            </div>
            <div className="w-44">
              <Input
                label="Ngày điểm danh"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)} />

            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<CheckSquareIcon className="w-4 h-4" />}
                onClick={() => markAll('PRESENT')}>

                Tất cả có mặt
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<SaveIcon className="w-4 h-4" />}
                loading={saving}
                onClick={handleSave}>

                Lưu điểm danh
              </Button>
            </div>
          </div>
        </Card>

        {selectedSection &&
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student list */}
            <div className="lg:col-span-2">
              <Card
              title={`Danh sách sinh viên (${sectionStudents.length})`}
              padding={false}>

                <div className="divide-y divide-slate-100">
                  {sectionStudents.map((student, idx) => {
                  if (!student) return null;
                  const status = attendanceMap[student.id] ?? 'ABSENT';
                  return (
                    <div
                      key={student.id}
                      className="flex items-center gap-4 px-5 py-3">

                        <span className="text-xs text-slate-400 w-6">
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
                            {student.studentId}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {(
                        ['PRESENT', 'LATE', 'ABSENT'] as AttendanceStatus[]).
                        map((s) =>
                        <button
                          key={s}
                          onClick={() =>
                          setAttendanceMap((prev) => ({
                            ...prev,
                            [student.id]: s
                          }))
                          }
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${status === s ? statusConfig[s].color : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>

                              {statusConfig[s].icon}
                              <span className="hidden sm:inline">
                                {statusConfig[s].label}
                              </span>
                            </button>
                        )}
                        </div>
                      </div>);

                })}
                </div>
              </Card>
            </div>

            {/* History */}
            <div>
              <Card title="Lịch sử điểm danh" subtitle="5 buổi gần nhất">
                <div className="space-y-3">
                  {historyDates.length === 0 ?
                <p className="text-sm text-slate-400 text-center py-4">
                      Chưa có lịch sử
                    </p> :

                historyDates.map((h) =>
                <div key={h.date} className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-semibold text-slate-700 mb-2">
                          {h.date}
                        </p>
                        <div className="flex gap-2">
                          <span className="flex items-center gap-1 text-xs text-emerald-700">
                            <CheckCircleIcon className="w-3 h-3" />
                            {h.present}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <XCircleIcon className="w-3 h-3" />
                            {h.absent}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <ClockIcon className="w-3 h-3" />
                            {h.late}
                          </span>
                        </div>
                      </div>
                )
                }
                </div>
              </Card>
            </div>
          </div>
        }

        {!selectedSection &&
        <div className="text-center py-16 text-slate-400">
            <CheckSquareIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Chọn lớp học phần để bắt đầu điểm danh</p>
          </div>
        }
      </div>
    </Layout>);

}