import React, { useCallback, useMemo, useState } from 'react';
import {
  SaveIcon,
  DownloadIcon,
  LockIcon,
  UnlockIcon,
  ClipboardListIcon } from
'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  courseSections,
  subjects,
  enrollments,
  users,
  grades as initialGrades,
  attendanceRecords,
  calculateGrade } from
'../../data/mockData';
interface GradeRow {
  studentId: string;
  name: string;
  studentCode: string;
  attendanceScore: number;
  midterm: number | '';
  final: number | '';
  totalScore: number | null;
  letterGrade: string;
  gpaPoint: number | null;
}
export function GradeManagement() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [selectedSection, setSelectedSection] = useState('');
  const [gradeRows, setGradeRows] = useState<GradeRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const myClasses = useMemo(
    () => courseSections.filter((cs) => cs.lecturerId === currentUser?.id),
    [currentUser]
  );
  const loadSection = useCallback((sectionId: string) => {
    setSelectedSection(sectionId);
    setLocked(false);
    const students = enrollments.
    filter((e) => e.courseSectionId === sectionId && e.status === 'ENROLLED').
    map((e) => users.find((u) => u.id === e.studentId)).
    filter(Boolean);
    const rows: GradeRow[] = students.
    map((student) => {
      if (!student) return null;
      const existing = initialGrades.find(
        (g) => g.studentId === student.id && g.courseSectionId === sectionId
      );
      const attRecords = attendanceRecords.filter(
        (a) => a.studentId === student.id && a.courseSectionId === sectionId
      );
      const presentCount = attRecords.filter(
        (a) => a.status === 'PRESENT'
      ).length;
      const lateCount = attRecords.filter((a) => a.status === 'LATE').length;
      const totalSessions = Math.max(attRecords.length, 1);
      const attScore =
      existing?.attendanceScore ??
      Math.round(
        (presentCount + lateCount * 0.5) / totalSessions * 10 * 10
      ) / 10;
      const midterm = existing?.midterm ?? '';
      const final = existing?.final ?? '';
      let totalScore: number | null = null;
      let letterGrade = '—';
      let gpaPoint: number | null = null;
      if (midterm !== '' && final !== '') {
        const calc = calculateGrade(
          midterm as number,
          final as number,
          attScore
        );
        totalScore = calc.totalScore;
        letterGrade = calc.letterGrade;
        gpaPoint = calc.gpaPoint;
      }
      return {
        studentId: student.id,
        name: student.name,
        studentCode: student.studentId ?? '',
        attendanceScore: attScore,
        midterm,
        final,
        totalScore,
        letterGrade,
        gpaPoint
      };
    }).
    filter(Boolean) as GradeRow[];
    setGradeRows(rows);
  }, []);
  const updateGrade = (
  studentId: string,
  field: 'midterm' | 'final',
  value: string) =>
  {
    if (locked) return;
    setGradeRows((prev) =>
    prev.map((row) => {
      if (row.studentId !== studentId) return row;
      const numVal =
      value === '' ? '' : Math.min(10, Math.max(0, parseFloat(value) || 0));
      const updated = {
        ...row,
        [field]: numVal
      };
      if (updated.midterm !== '' && updated.final !== '') {
        const calc = calculateGrade(
          updated.midterm as number,
          updated.final as number,
          updated.attendanceScore
        );
        return {
          ...updated,
          totalScore: calc.totalScore,
          letterGrade: calc.letterGrade,
          gpaPoint: calc.gpaPoint
        };
      }
      return {
        ...updated,
        totalScore: null,
        letterGrade: '—',
        gpaPoint: null
      };
    })
    );
  };
  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    showToast('Lưu bảng điểm thành công!', 'success');
    setSaving(false);
  };
  const handleExport = () => {
    showToast('Đang xuất bảng điểm PDF... (Tính năng demo)', 'info');
  };
  const letterGradeBadge = (grade: string) => {
    if (grade === '—') return <span className="text-slate-400">—</span>;
    const variant = ['A', 'B+', 'B'].includes(grade) ?
    'success' :
    ['C+', 'C'].includes(grade) ?
    'warning' :
    grade === 'F' ?
    'error' :
    'neutral';
    return (
      <Badge variant={variant as 'success' | 'warning' | 'error' | 'neutral'}>
        {grade}
      </Badge>);

  };
  return (
    <Layout title="Nhập điểm">
      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[250px]">
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
                onChange={(e) => loadSection(e.target.value)}
                placeholder="Chọn lớp học phần" />

            </div>
            {selectedSection &&
            <div className="flex gap-2 flex-wrap">
                <Button
                variant="outline"
                size="sm"
                icon={
                locked ?
                <UnlockIcon className="w-4 h-4" /> :

                <LockIcon className="w-4 h-4" />

                }
                onClick={() => {
                  setLocked((v) => !v);
                  showToast(
                    locked ? 'Đã mở khóa bảng điểm' : 'Đã khóa bảng điểm',
                    'info'
                  );
                }}>

                  {locked ? 'Mở khóa' : 'Khóa điểm'}
                </Button>
                <Button
                variant="outline"
                size="sm"
                icon={<DownloadIcon className="w-4 h-4" />}
                onClick={handleExport}>

                  Xuất PDF
                </Button>
                <Button
                variant="primary"
                size="sm"
                icon={<SaveIcon className="w-4 h-4" />}
                loading={saving}
                onClick={handleSave}
                disabled={locked}>

                  Lưu tất cả
                </Button>
              </div>
            }
          </div>
        </Card>

        {selectedSection && gradeRows.length > 0 &&
        <Card padding={false}>
            {locked &&
          <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-700 font-medium">
                <LockIcon className="w-3.5 h-3.5" />
                Bảng điểm đã được khóa. Không thể chỉnh sửa.
              </div>
          }
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Sinh viên
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Chuyên cần
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Điểm GK
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Điểm CK
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Điểm tổng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Điểm chữ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      GPA
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gradeRows.map((row, idx) =>
                <tr
                  key={row.studentId}
                  className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">

                      <td className="px-4 py-3 text-xs text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {row.name}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {row.studentCode}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">
                          {row.attendanceScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={row.midterm}
                      onChange={(e) =>
                      updateGrade(
                        row.studentId,
                        'midterm',
                        e.target.value
                      )
                      }
                      disabled={locked}
                      placeholder="—"
                      className="w-20 px-2 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500" />

                      </td>
                      <td className="px-4 py-3">
                        <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={row.final}
                      onChange={(e) =>
                      updateGrade(row.studentId, 'final', e.target.value)
                      }
                      disabled={locked}
                      placeholder="—"
                      className="w-20 px-2 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500" />

                      </td>
                      <td className="px-4 py-3">
                        <span
                      className={`text-sm font-bold ${row.totalScore !== null ? row.totalScore >= 5 ? 'text-emerald-700' : 'text-red-600' : 'text-slate-400'}`}>

                          {row.totalScore !== null ?
                      row.totalScore.toFixed(2) :
                      '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {letterGradeBadge(row.letterGrade)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-slate-700">
                          {row.gpaPoint !== null ?
                      row.gpaPoint.toFixed(1) :
                      '—'}
                        </span>
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
              Công thức: Điểm tổng = 0.1 × Chuyên cần + 0.3 × Giữa kỳ + 0.6 ×
              Cuối kỳ
            </div>
          </Card>
        }

        {!selectedSection &&
        <div className="text-center py-16 text-slate-400">
            <ClipboardListIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Chọn lớp học phần để nhập điểm</p>
          </div>
        }
      </div>
    </Layout>);

}