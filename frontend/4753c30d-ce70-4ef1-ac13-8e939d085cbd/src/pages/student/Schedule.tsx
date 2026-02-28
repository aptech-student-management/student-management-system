import React, { useMemo, useState } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ListIcon } from
'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import {
  enrollments,
  courseSections,
  subjects,
  users,
  semesters } from
'../../data/mockData';
const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const PERIODS = ['1-3', '4-6', '7-9', '10-12'];
const SUBJECT_COLORS = [
'bg-sky-100 border-sky-300 text-sky-800',
'bg-teal-100 border-teal-300 text-teal-800',
'bg-purple-100 border-purple-300 text-purple-800',
'bg-amber-100 border-amber-300 text-amber-800',
'bg-rose-100 border-rose-300 text-rose-800',
'bg-indigo-100 border-indigo-300 text-indigo-800'];

export function Schedule() {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const activeSemester = semesters.find((s) => s.status === 'ACTIVE');
  const myCourseSections = useMemo(() => {
    const myEnrollments = enrollments.filter(
      (e) => e.studentId === currentUser?.id && e.status === 'ENROLLED'
    );
    return myEnrollments.
    map((e) => courseSections.find((cs) => cs.id === e.courseSectionId)).
    filter((cs) => cs?.semesterId === activeSemester?.id).
    filter(Boolean);
  }, [currentUser, activeSemester]);
  // Build schedule grid
  const scheduleGrid = useMemo(() => {
    const grid: Record<
      string,
      Record<string, (typeof myCourseSections)[0]>> =
    {};
    DAYS.forEach((day) => {
      grid[day] = {};
    });
    myCourseSections.forEach((cs, idx) => {
      if (!cs) return;
      const schedule = cs.schedule;
      // Parse "Thứ 2 (Tiết 1-3)" format
      const dayMatch = schedule.match(/Thứ (\d)/);
      const periodMatch = schedule.match(/Tiết (\d+-\d+)/);
      if (dayMatch && periodMatch) {
        const dayNum = parseInt(dayMatch[1]);
        const dayName = `Thứ ${dayNum}`;
        const period = periodMatch[1];
        if (grid[dayName]) {
          grid[dayName][period] = cs;
        }
      }
    });
    return grid;
  }, [myCourseSections]);
  const getSubjectColor = (subjectId: string) => {
    const idx = myCourseSections.findIndex((cs) => cs?.subjectId === subjectId);
    return SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
  };
  const getLecturerName = (id: string) =>
  users.find((u) => u.id === id)?.name ?? '—';
  return (
    <Layout title="Thời khóa biểu">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{activeSemester?.name}</p>
            <p className="text-xs text-slate-400">
              {myCourseSections.length} môn học đã đăng ký
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-sky-100 text-sky-700' : 'text-slate-400 hover:bg-slate-100'}`}
              aria-label="Xem dạng lưới">

              <CalendarIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-sky-100 text-sky-700' : 'text-slate-400 hover:bg-slate-100'}`}
              aria-label="Xem dạng danh sách">

              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {viewMode === 'grid' ?
        <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-3 text-left font-semibold text-slate-500 w-20">
                      Tiết
                    </th>
                    {DAYS.map((day) =>
                  <th
                    key={day}
                    className="px-3 py-3 text-center font-semibold text-slate-600 min-w-[120px]">

                        {day}
                      </th>
                  )}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period) =>
                <tr key={period} className="border-b border-slate-100">
                      <td className="px-3 py-4 text-slate-500 font-medium text-center bg-slate-50">
                        <div>
                          <p className="font-semibold text-slate-700">
                            {period}
                          </p>
                        </div>
                      </td>
                      {DAYS.map((day) => {
                    const cs = scheduleGrid[day]?.[period];
                    if (!cs)
                    return (
                      <td
                        key={day}
                        className="px-2 py-2 border-l border-slate-100" />);


                    const subj = subjects.find((s) => s.id === cs.subjectId);
                    const colorClass = getSubjectColor(cs.subjectId);
                    return (
                      <td
                        key={day}
                        className="px-2 py-2 border-l border-slate-100">

                            <div
                          className={`rounded-lg border p-2 ${colorClass}`}>

                              <p className="font-semibold text-xs leading-tight mb-1">
                                {subj?.name}
                              </p>
                              <p className="text-xs opacity-75">
                                Phòng {cs.room}
                              </p>
                              <p className="text-xs opacity-60 truncate">
                                {getLecturerName(cs.lecturerId).
                            split('.').
                            pop()?.
                            trim()}
                              </p>
                            </div>
                          </td>);

                  })}
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          </Card> :

        <div className="space-y-3">
            {myCourseSections.map((cs, idx) => {
            if (!cs) return null;
            const subj = subjects.find((s) => s.id === cs.subjectId);
            const colorClass = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
            return (
              <div
                key={cs.id}
                className={`rounded-xl border p-4 ${colorClass}`}>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{subj?.name}</h3>
                      <p className="text-xs opacity-75 mt-1">
                        {subj?.code} · {subj?.credits} tín chỉ
                      </p>
                    </div>
                    <span className="text-xs font-medium opacity-75 bg-white/50 px-2 py-1 rounded-full">
                      {cs.schedule}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs opacity-75">
                    <span>📍 Phòng {cs.room}</span>
                    <span>👨‍🏫 {getLecturerName(cs.lecturerId)}</span>
                  </div>
                </div>);

          })}
            {myCourseSections.length === 0 &&
          <div className="text-center py-16 text-slate-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có lịch học nào</p>
              </div>
          }
          </div>
        }

        {/* Legend */}
        {viewMode === 'grid' && myCourseSections.length > 0 &&
        <Card title="Chú thích">
            <div className="flex flex-wrap gap-3">
              {myCourseSections.map((cs, idx) => {
              if (!cs) return null;
              const subj = subjects.find((s) => s.id === cs.subjectId);
              const colorClass = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
              return (
                <div
                  key={cs.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${colorClass}`}>

                    <span>{subj?.name}</span>
                  </div>);

            })}
            </div>
          </Card>
        }
      </div>
    </Layout>);

}