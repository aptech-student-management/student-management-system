import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarIcon,
  ListIcon
} from
  'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { getEnrollmentsApi } from '../../services/enrollmentService';
import { getCourseSectionsApi } from '../../services/courseSectionService';
import { getSubjectsApi } from '../../services/subjectService';
import { getLecturersApi } from '../../services/userService';
import { getSemestersApi } from '../../services/semesterService';
import type { CourseSection, Enrollment, Semester, Subject, User } from '../../types';
import { formatVNDate } from '../../utils/date';
import { getScheduleWeekMatch, SCHEDULE_DAYS, TIME_SLOTS, parseScheduleValue } from '../../utils/schedule';
const PERIODS = TIME_SLOTS.map((item) => item.period);
const SUBJECT_COLORS = [
  'bg-sky-100 border-sky-300 text-sky-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-amber-100 border-amber-300 text-amber-800',
  'bg-rose-100 border-rose-300 text-rose-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800'];

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function Schedule() {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [enrollmentData, sectionData, subjectData, userData, semesterData] = await Promise.all([
          getEnrollmentsApi(),
          getCourseSectionsApi(),
          getSubjectsApi(),
          getLecturersApi(),
          getSemestersApi()
        ]);
        setEnrollments(enrollmentData);
        setCourseSections(sectionData);
        setSubjects(subjectData);
        setUsers(userData);
        setSemesters(semesterData);
      } catch {
        // silent fail to keep UI stable
      }
    };

    void loadData();
  }, []);

  const activeSemester = semesters.find((s) => s.status === 'ACTIVE');
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(today.getDate() + distanceToMonday);

    return SCHEDULE_DAYS.map((item, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        ...item,
        date,
        dateLabel: formatVNDate(`${toDateKey(date)}T00:00:00`)
      };
    });
  }, []);

  const isDateInActiveSemester = useCallback((date: Date) => {
    const semesterStart = activeSemester?.startDate ? new Date(activeSemester.startDate) : null;
    const semesterEnd = activeSemester?.endDate ? new Date(activeSemester.endDate) : null;

    if (!semesterStart || !semesterEnd) return true;

    const value = new Date(date);
    value.setHours(0, 0, 0, 0);

    const start = new Date(semesterStart);
    const end = new Date(semesterEnd);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return value >= start && value <= end;
  }, [activeSemester?.endDate, activeSemester?.startDate]);

  const myCourseSections = useMemo(() => {
    const myEnrollments = enrollments.filter(
      (e) => e.studentId === currentUser?.studentId && e.status === 'ENROLLED'
    );
    return myEnrollments
      .map((e) => courseSections.find((cs) => cs.id === e.courseSectionId))
      .filter((cs) => cs?.semesterId === activeSemester?.id)
      .filter(Boolean) as CourseSection[];
  }, [currentUser?.studentId, activeSemester, enrollments, courseSections]);

  const scheduleGrid = useMemo(() => {
    const grid: Record<
      string,
      Record<string, (typeof myCourseSections)[0]>> =
      {};
    currentWeekDays.forEach((day) => {
      grid[day.label] = {};
    });

    myCourseSections.forEach((cs) => {
      if (!cs) return;
      const { parsed, matchedDay, actualDate } = getScheduleWeekMatch(cs.schedule, currentWeekDays);
      if (!matchedDay || !actualDate) {
        return;
      }

      if (!isDateInActiveSemester(actualDate)) {
        return;
      }

      if (grid[matchedDay.label] && PERIODS.includes(parsed.periodLabel)) {
        grid[matchedDay.label][parsed.periodLabel] = cs;
      }
    });

    return grid;
  }, [currentWeekDays, isDateInActiveSemester, myCourseSections]);

  const listSections = useMemo(() => {
    return [...myCourseSections]
      .map((section) => ({
        section,
        ...getScheduleWeekMatch(section.schedule, currentWeekDays)
      }))
      .filter((item) => item.actualDate && isDateInActiveSemester(item.actualDate))
      .sort((a, b) => {
        const dateA = a.actualDate ? a.actualDate.getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.actualDate ? b.actualDate.getTime() : Number.MAX_SAFE_INTEGER;

        if (dateA !== dateB) {
          return dateA - dateB;
        }

        const periodIndexA = PERIODS.indexOf(a.parsed?.periodLabel ?? '');
        const periodIndexB = PERIODS.indexOf(b.parsed?.periodLabel ?? '');
        const normalizedPeriodA = periodIndexA === -1 ? 99 : periodIndexA;
        const normalizedPeriodB = periodIndexB === -1 ? 99 : periodIndexB;

        return normalizedPeriodA - normalizedPeriodB;
      });
  }, [currentWeekDays, isDateInActiveSemester, myCourseSections]);

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
            <p className="text-xs text-slate-400">
              Tuần hiện tại: {currentWeekDays[0]?.dateLabel} - {currentWeekDays[currentWeekDays.length - 1]?.dateLabel}
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
                    {currentWeekDays.map((day) =>
                      <th
                        key={day.label}
                        className="px-3 py-3 text-center font-semibold text-slate-600 min-w-[120px]">

                        <div className="space-y-1">
                          <p>{day.label}</p>
                          <p className="text-[11px] font-normal text-slate-400">{day.dateLabel}</p>
                        </div>
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
                      {currentWeekDays.map((day) => {
                        const cs = isDateInActiveSemester(day.date)
                          ? scheduleGrid[day.label]?.[period]
                          : undefined;
                        if (!cs)
                          return (
                            <td
                              key={day.label}
                              className="px-2 py-2 border-l border-slate-100" />);


                        const subj = subjects.find((s) => s.id === cs.subjectId);
                        const colorClass = getSubjectColor(cs.subjectId);
                        const parsed = parseScheduleValue(cs.schedule);
                        return (
                          <td
                            key={day.label}
                            className="px-2 py-2 border-l border-slate-100">

                            <div
                              className={`rounded-lg border p-2 ${colorClass}`}>

                              <p className="font-semibold text-xs leading-tight mb-1">
                                {subj?.name}
                              </p>
                              <p className="text-xs opacity-75">
                                Phòng {cs.room}
                              </p>
                              <p className="text-xs opacity-60">
                                {parsed?.timeLabel}
                              </p>
                              <p className="text-xs opacity-60 truncate">
                                {getLecturerName(cs.lecturerId)}
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
            {listSections.map(({ section: cs, parsed, actualDate }, idx) => {
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
                      {parsed?.dayLabel && parsed?.timeLabel
                        ? `${parsed.dayLabel} · ${actualDate ? formatVNDate(`${toDateKey(actualDate)}T00:00:00`) : parsed.dateLabel} · ${parsed.timeLabel}`
                        : cs.schedule}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs opacity-75">
                    <span>Phòng {cs.room}</span>
                    <span>Giảng viên: {getLecturerName(cs.lecturerId)}</span>
                  </div>
                </div>);
            })}
            {listSections.length === 0 &&
              <div className="text-center py-16 text-slate-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Không có lịch học trong tuần hiện tại</p>
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
