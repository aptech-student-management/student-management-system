import { useEffect, useMemo, useState } from 'react';
import {
  DownloadIcon,
  TrendingUpIcon,
  AwardIcon,
  BookOpenIcon,
  TargetIcon
} from
  'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import type { CourseSection, Grade, Semester, Subject } from '../../types';
import { getGradesApi } from '../../services/gradeService';
import { getCourseSectionsApi } from '../../services/courseSectionService';
import { getSubjectsApi } from '../../services/subjectService';
import { getSemestersApi } from '../../services/semesterService';
import { formatVNDate } from '../../utils/date';
const TOTAL_CREDITS_REQUIRED = 120;
export function Transcript() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [gradeData, sectionData, subjectData, semesterData] = await Promise.all([
          getGradesApi({ studentId: currentUser?.studentId }),
          getCourseSectionsApi(),
          getSubjectsApi(),
          getSemestersApi()
        ]);

        setGrades(gradeData);
        setCourseSections(sectionData);
        setSubjects(subjectData);
        setSemesters(semesterData);
        if (!selectedSemester && semesterData.length > 0) {
          setSelectedSemester(semesterData[0].id);
        }
      } catch {
        showToast('Không thể tải dữ liệu bảng điểm', 'error');
      }
    };

    if (currentUser?.studentId) {
      void loadData();
    }
  }, [currentUser?.studentId, showToast]);

  const myGrades = useMemo(
    () => grades.filter((g) => g.studentId === currentUser?.studentId),
    [grades, currentUser?.studentId]
  );
  const gradesBySemester = useMemo(() => {
    const result: Record<string, typeof myGrades> = {};
    semesters.forEach((sem) => {
      const semGrades = myGrades.filter((g) => {
        const cs = courseSections.find((c) => c.id === g.courseSectionId);
        return cs?.semesterId === sem.id;
      });
      if (semGrades.length > 0) result[sem.id] = semGrades;
    });
    return result;
  }, [myGrades, courseSections, subjects]);
  const currentSemGrades = gradesBySemester[selectedSemester] ?? [];
  const calcSemGPA = (semGrades: typeof myGrades) => {
    if (semGrades.length === 0) return null;
    const graded = semGrades.filter((g) => g.gpaPoint !== undefined);
    if (graded.length === 0) return null;
    const totalPoints = graded.reduce((sum, g) => {
      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      const subj = subjects.find((s) => s.id === cs?.subjectId);
      return sum + (g.gpaPoint ?? 0) * (subj?.credits ?? 0);
    }, 0);
    const totalCredits = graded.reduce((sum, g) => {
      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      const subj = subjects.find((s) => s.id === cs?.subjectId);
      return sum + (subj?.credits ?? 0);
    }, 0);
    return totalCredits > 0 ?
      Math.round(totalPoints / totalCredits * 100) / 100 :
      null;
  };
  const cumulativeGPA = useMemo(() => {
    const allGraded = myGrades.filter((g) => g.gpaPoint !== undefined);
    if (allGraded.length === 0) return null;
    const totalPoints = allGraded.reduce((sum, g) => {
      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      const subj = subjects.find((s) => s.id === cs?.subjectId);
      return sum + (g.gpaPoint ?? 0) * (subj?.credits ?? 0);
    }, 0);
    const totalCredits = allGraded.reduce((sum, g) => {
      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      const subj = subjects.find((s) => s.id === cs?.subjectId);
      return sum + (subj?.credits ?? 0);
    }, 0);
    return totalCredits > 0 ?
      Math.round(totalPoints / totalCredits * 100) / 100 :
      null;
  }, [myGrades, courseSections, subjects]);
  const completedCredits = useMemo(() => {
    return myGrades.
      filter((g) => g.gpaPoint !== undefined && g.gpaPoint > 0).
      reduce((sum, g) => {
        const cs = courseSections.find((c) => c.id === g.courseSectionId);
        const subj = subjects.find((s) => s.id === cs?.subjectId);
        return sum + (subj?.credits ?? 0);
      }, 0);
  }, [myGrades]);
  const semGPA = calcSemGPA(currentSemGrades);
  const letterGradeBadge = (grade?: string) => {
    if (!grade) return <span className="text-slate-400">—</span>;
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
  const handleExport = () => {
    if (!currentUser) return;

    const selectedSemesterLabel = semesters.find((s) => s.id === selectedSemester);
    const rowsHtml = currentSemGrades.map((g, index) => {
      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      const subj = subjects.find((s) => s.id === cs?.subjectId);

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${subj?.code ?? '—'}</td>
          <td>${subj?.name ?? '—'}</td>
          <td>${subj?.credits ?? '—'}</td>
          <td>${g.midterm ?? '—'}</td>
          <td>${g.final ?? '—'}</td>
          <td>${g.totalScore?.toFixed(2) ?? '—'}</td>
          <td>${g.letterGrade ?? '—'}</td>
          <td>${g.gpaPoint?.toFixed(1) ?? '—'}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!doctype html>
      <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Bang diem - ${currentUser.studentId ?? currentUser.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
          h1, h2, p { margin: 0 0 8px; }
          .meta { margin-bottom: 24px; }
          .summary { margin: 16px 0 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background: #f8fafc; }
          .muted { color: #475569; }
        </style>
      </head>
      <body>
        <h1>Bảng điểm sinh viên</h1>
        <div class="meta">
          <p><strong>Họ tên:</strong> ${currentUser.name}</p>
          <p><strong>Mã sinh viên:</strong> ${currentUser.studentId ?? '—'}</p>
          <p><strong>Email:</strong> ${currentUser.email}</p>
          <p><strong>Học kỳ:</strong> ${selectedSemesterLabel ? `${selectedSemesterLabel.name} (${selectedSemesterLabel.year})` : 'Toàn bộ'}</p>
          <p><strong>Ngày xuất:</strong> ${formatVNDate(new Date().toISOString())}</p>
        </div>
        <div class="summary">
          <div class="card"><strong>GPA học kỳ</strong><p class="muted">${semGPA !== null ? semGPA.toFixed(2) : 'N/A'}</p></div>
          <div class="card"><strong>GPA tích lũy</strong><p class="muted">${cumulativeGPA !== null ? cumulativeGPA.toFixed(2) : 'N/A'}</p></div>
          <div class="card"><strong>Tín chỉ đạt</strong><p class="muted">${completedCredits}/${TOTAL_CREDITS_REQUIRED}</p></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã môn</th>
              <th>Môn học</th>
              <th>Tín chỉ</th>
              <th>Giữa kỳ</th>
              <th>Cuối kỳ</th>
              <th>Tổng kết</th>
              <th>Điểm chữ</th>
              <th>GPA</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="9">Không có dữ liệu điểm cho học kỳ này</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      showToast('Trình duyệt đang chặn cửa sổ xuất PDF', 'error');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    showToast('Đã mở cửa sổ xuất bảng điểm. Bạn có thể chọn Save as PDF.', 'success');
  };
  const creditProgress = Math.min(
    completedCredits / TOTAL_CREDITS_REQUIRED * 100,
    100
  );
  return (
    <Layout title="Bảng điểm">
      <div className="space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="GPA Học kỳ"
            value={semGPA !== null ? semGPA.toFixed(2) : 'N/A'}
            subtitle={semesters.find((s) => s.id === selectedSemester)?.name}
            icon={<TrendingUpIcon className="w-5 h-5" />}
            color="sky" />

          <StatCard
            title="GPA Tích lũy"
            value={cumulativeGPA !== null ? cumulativeGPA.toFixed(2) : 'N/A'}
            subtitle="Toàn khóa học"
            icon={<AwardIcon className="w-5 h-5" />}
            color="blue" />

          <StatCard
            title="Tín chỉ đạt"
            value={completedCredits}
            subtitle="Đã hoàn thành"
            icon={<BookOpenIcon className="w-5 h-5" />}
            color="emerald" />

          <StatCard
            title="Tiến độ"
            value={`${Math.round(creditProgress)}%`}
            subtitle={`${completedCredits}/${TOTAL_CREDITS_REQUIRED} TC`}
            icon={<TargetIcon className="w-5 h-5" />}
            color="amber" />

        </div>

        {/* Credit progress bar */}
        <Card>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-700">
                Tiến độ tín chỉ tích lũy
              </span>
              <span className="font-semibold text-slate-900">
                {completedCredits}/{TOTAL_CREDITS_REQUIRED} TC
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-700"
                style={{
                  width: `${creditProgress}%`
                }} />

            </div>
          </div>
        </Card>

        {/* Semester tabs + grades table */}
        <Card
          padding={false}
          title="Chi tiết điểm số"
          action={
            <span onClick={handleExport}>
              <Button
                variant="outline"
                size="sm"
                icon={<DownloadIcon className="w-4 h-4" />}>
                Xuất PDF
              </Button>
            </span>
          }>

          {/* Semester tabs */}
          <div className="flex items-center gap-1 px-4 pt-4 pb-0 overflow-x-auto">
            {semesters.map((sem) =>
              <button
                key={sem.id}
                onClick={() => setSelectedSemester(sem.id)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-all border-b-2 ${selectedSemester === sem.id ? 'text-sky-700 border-sky-600 bg-sky-50' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'}`}>

                {sem.name}
                {gradesBySemester[sem.id] &&
                  <span className="ml-1.5 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                    {gradesBySemester[sem.id].length}
                  </span>
                }
              </button>
            )}
          </div>

          <div className="border-t border-slate-200">
            {currentSemGrades.length === 0 ?
              <div className="text-center py-12 text-slate-400">
                <BookOpenIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Không có dữ liệu điểm cho học kỳ này</p>
              </div> :

              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Môn học
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Tín chỉ
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
                      {currentSemGrades.map((g) => {
                        const cs = courseSections.find(
                          (c) => c.id === g.courseSectionId
                        );
                        const subj = subjects.find(
                          (s) => s.id === cs?.subjectId
                        );
                        return (
                          <tr
                            key={g.id}
                            className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">

                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900">
                                {subj?.name}
                              </p>
                              <p className="text-xs text-slate-500 font-mono">
                                {subj?.code}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="info">{subj?.credits}</Badge>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700">
                              {g.midterm ?? '—'}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700">
                              {g.final ?? '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`font-bold text-sm ${g.totalScore !== undefined && g.totalScore >= 5 ? 'text-emerald-700' : 'text-red-600'}`}>

                                {g.totalScore?.toFixed(2) ?? '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {letterGradeBadge(g.letterGrade)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-700">
                                {g.gpaPoint?.toFixed(1) ?? '—'}
                              </span>
                            </td>
                          </tr>);

                      })}
                    </tbody>
                  </table>
                </div>
                {semGPA !== null &&
                  <div className="px-4 py-3 bg-sky-50 border-t border-sky-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-sky-800">
                      GPA học kỳ này
                    </span>
                    <span className="text-lg font-bold text-sky-900">
                      {semGPA.toFixed(2)}
                    </span>
                  </div>
                }
              </>
            }
          </div>
        </Card>
      </div>
    </Layout>);

}
