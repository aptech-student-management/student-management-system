import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUpIcon,
  BookOpenIcon,
  AwardIcon,
  TargetIcon,
  ClockIcon
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import { Layout } from "../../components/layout/Layout";
import { StatCard } from "../../components/ui/StatCard";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import type { CourseSection, Enrollment, Grade, Semester, Subject } from "../../types";
import { getEnrollmentsApi } from "../../services/enrollmentService";
import { getCourseSectionsApi } from "../../services/courseSectionService";
import { getSubjectsApi } from "../../services/subjectService";
import { getGradesApi } from "../../services/gradeService";
import { getSemestersApi } from "../../services/semesterService";

const TOTAL_CREDITS_REQUIRED = 120;

export function StudentDashboard() {

  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [enrollmentData, sectionData, subjectData, gradeData, semesterData] = await Promise.all([
          getEnrollmentsApi(),
          getCourseSectionsApi(),
          getSubjectsApi(),
          getGradesApi({ studentId: currentUser?.id }),
          getSemestersApi()
        ]);

        setEnrollments(enrollmentData);
        setCourseSections(sectionData);
        setSubjects(subjectData);
        setGrades(gradeData);
        setSemesters(semesterData);
      } catch {
        showToast("Không thể tải dữ liệu dashboard sinh viên", "error");
      }
    };

    if (currentUser?.id) {
      void loadData();
    }
  }, [currentUser?.id, showToast]);

  const myEnrollments = useMemo(
    () =>
      enrollments.filter(
        (e) => e.studentId === currentUser?.id && e.status === "ENROLLED"
      ),
    [currentUser]
  );

  const activeSemester = semesters.find((s) => s.status === "ACTIVE") ?? semesters[0];

  const currentCourses = useMemo(
    () =>
      myEnrollments
        .map((e) =>
          courseSections.find((cs) => cs.id === e.courseSectionId)
        )
        .filter((cs) => cs?.semesterId === activeSemester?.id)
        .filter(Boolean),
    [myEnrollments, activeSemester]
  );

  const myGrades = useMemo(
    () => grades.filter((g) => g.studentId === currentUser?.id),
    [currentUser]
  );

  const completedCredits = useMemo(() => {

    return myGrades
      .filter((g) => g.gpaPoint !== undefined && g.gpaPoint > 0)
      .reduce((sum, g) => {

        const cs = courseSections.find((c) => c.id === g.courseSectionId);
        const subj = subjects.find((s) => s.id === cs?.subjectId);

        return sum + (subj?.credits ?? 0);

      }, 0);

  }, [myGrades]);

  const currentSemGPA = useMemo(() => {

    const currentGrades = myGrades.filter((g) => {

      const cs = courseSections.find((c) => c.id === g.courseSectionId);

      return (
        cs?.semesterId === activeSemester?.id &&
        g.gpaPoint !== undefined
      );

    });

    if (currentGrades.length === 0) return null;

    const totalPoints = currentGrades.reduce((sum, g) => {

      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      const subj = subjects.find((s) => s.id === cs?.subjectId);

      return sum + (g.gpaPoint ?? 0) * (subj?.credits ?? 0);

    }, 0);

    const totalCredits = currentGrades.reduce((sum, g) => {

      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      const subj = subjects.find((s) => s.id === cs?.subjectId);

      return sum + (subj?.credits ?? 0);

    }, 0);

    return totalCredits > 0
      ? Math.round((totalPoints / totalCredits) * 100) / 100
      : null;

  }, [myGrades, activeSemester]);

  const cumulativeGPA = useMemo(() => {

    const gradedItems = myGrades.filter(
      (g) => g.gpaPoint !== undefined
    );

    if (gradedItems.length === 0) return null;

    const totalPoints = gradedItems.reduce((sum, g) => {

      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      const subj = subjects.find((s) => s.id === cs?.subjectId);

      return sum + (g.gpaPoint ?? 0) * (subj?.credits ?? 0);

    }, 0);

    const totalCredits = gradedItems.reduce((sum, g) => {

      const cs = courseSections.find((c) => c.id === g.courseSectionId);
      const subj = subjects.find((s) => s.id === cs?.subjectId);

      return sum + (subj?.credits ?? 0);

    }, 0);

    return totalCredits > 0
      ? Math.round((totalPoints / totalCredits) * 100) / 100
      : null;

  }, [myGrades]);

  const gpaHistory = useMemo(() => {
    const semGpaMap = semesters
      .map((semester) => {
        const semGrades = myGrades.filter((grade) => {
          const section = courseSections.find((cs) => cs.id === grade.courseSectionId);
          return section?.semesterId === semester.id && grade.gpaPoint !== undefined;
        });

        if (semGrades.length === 0) return null;

        const totalPoints = semGrades.reduce((sum, grade) => {
          const section = courseSections.find((cs) => cs.id === grade.courseSectionId);
          const subject = subjects.find((s) => s.id === section?.subjectId);
          return sum + (grade.gpaPoint ?? 0) * (subject?.credits ?? 0);
        }, 0);

        const totalCredits = semGrades.reduce((sum, grade) => {
          const section = courseSections.find((cs) => cs.id === grade.courseSectionId);
          const subject = subjects.find((s) => s.id === section?.subjectId);
          return sum + (subject?.credits ?? 0);
        }, 0);

        if (totalCredits === 0) return null;

        return {
          name: semester.name,
          GPA: Math.round((totalPoints / totalCredits) * 100) / 100
        };
      })
      .filter(Boolean) as { name: string; GPA: number }[];

    return semGpaMap.slice(-4);
  }, [semesters, myGrades, courseSections, subjects]);

  const creditProgress = Math.min(
    (completedCredits / TOTAL_CREDITS_REQUIRED) * 100,
    100
  );

  return (

    <Layout title="Dashboard - Sinh viên">

      <div className="space-y-8">

        {/* STATISTICS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <StatCard
            title="GPA học kỳ"
            value={currentSemGPA?.toFixed(2) ?? "N/A"}
            change={
              currentSemGPA && currentSemGPA >= 3
                ? "Xuất sắc"
                : "Cần cải thiện"
            }
            changeType={
              currentSemGPA && currentSemGPA >= 3
                ? "up"
                : "down"
            }
            icon={<TrendingUpIcon className="w-5 h-5"/>}
            color="sky"
            subtitle={activeSemester?.name}
          />

          <StatCard
            title="GPA tích lũy"
            value={cumulativeGPA?.toFixed(2) ?? "N/A"}
            subtitle="Toàn khóa"
            icon={<AwardIcon className="w-5 h-5"/>}
            color="blue"
          />

          <StatCard
            title="Tín chỉ"
            value={`${completedCredits}/${TOTAL_CREDITS_REQUIRED}`}
            subtitle={`Còn ${TOTAL_CREDITS_REQUIRED - completedCredits}`}
            icon={<TargetIcon className="w-5 h-5"/>}
            color="emerald"
          />

          <StatCard
            title="Môn học"
            value={currentCourses.length}
            subtitle={activeSemester?.name}
            icon={<BookOpenIcon className="w-5 h-5"/>}
            color="amber"
          />

        </div>

        {/* CREDIT PROGRESS */}

        <Card
          title="Tiến độ tín chỉ"
          subtitle={`${completedCredits}/${TOTAL_CREDITS_REQUIRED} tín chỉ`}
        >

          <div className="space-y-3">

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Hoàn thành</span>
              <span className="font-semibold">
                {Math.round(creditProgress)}%
              </span>
            </div>

            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">

              <div
                className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-700"
                style={{ width: `${creditProgress}%` }}
              />

            </div>

            <div className="flex justify-between text-xs text-slate-400">
              <span>{completedCredits}</span>
              <span>{TOTAL_CREDITS_REQUIRED} TC</span>
            </div>

          </div>

        </Card>

        {/* COURSES + GPA CHART */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Card
            title="Môn học hiện tại"
            subtitle={activeSemester?.name}
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/student/registration")}
              >
                Xem thêm →
              </Button>
            }
          >

            <div className="space-y-3">

              {currentCourses.length === 0 ? (

                <p className="text-sm text-slate-400 text-center py-4">
                  Chưa đăng ký môn học
                </p>

              ) : (

                currentCourses.map((cs) => {

                  const subj = subjects.find(
                    (s) => s.id === cs?.subjectId
                  );

                  return (
                    <div
                      key={cs?.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition"
                    >

                      <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center">
                        <BookOpenIcon className="w-4 h-4 text-sky-600"/>
                      </div>

                      <div className="flex-1">

                        <p className="text-sm font-medium">
                          {subj?.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {cs?.schedule} · Phòng {cs?.room}
                        </p>

                      </div>

                      <Badge variant="info">
                        {subj?.credits} TC
                      </Badge>

                    </div>
                  );
                })

              )}

            </div>

          </Card>

          <Card title="Xu hướng GPA" subtitle="4 học kỳ gần nhất">

            {gpaHistory.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">Chưa có dữ liệu GPA theo học kỳ</p>
            ) : (
            <ResponsiveContainer width="100%" height={220}>

              <LineChart data={gpaHistory}>

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>

                <XAxis dataKey="name"/>

                <YAxis domain={[2.5,4]}/>

                <Tooltip formatter={(v)=>[v,"GPA"]}/>

                <Line
                  type="monotone"
                  dataKey="GPA"
                  strokeWidth={2.5}
                  stroke="#0284c7"
                  dot={{ r:5 }}
                />

              </LineChart>

            </ResponsiveContainer>
            )}

          </Card>

        </div>

        {/* TODAY SCHEDULE */}

        <Card
          title="Lịch học hôm nay"
          icon={<ClockIcon className="w-4 h-4"/>}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={()=>navigate("/student/schedule")}
            >
              Xem TKB →
            </Button>
          }
        >

          <div className="space-y-3">

            {currentCourses.slice(0,2).map((cs)=>{

              const subj = subjects.find(
                s => s.id === cs?.subjectId
              );

              return (

                <div
                  key={cs?.id}
                  className="flex items-center gap-4 p-4 bg-sky-50 rounded-lg border border-sky-100"
                >

                  <div className="text-xs font-semibold text-sky-700 min-w-[60px]">
                    {cs?.schedule}
                  </div>

                  <div className="flex-1">

                    <p className="font-semibold">
                      {subj?.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      Phòng {cs?.room}
                    </p>

                  </div>

                </div>

              );

            })}

            {currentCourses.length === 0 && (

              <p className="text-sm text-slate-400 text-center py-4">
                Không có lịch học hôm nay
              </p>

            )}

          </div>

        </Card>

      </div>

    </Layout>

  );
}
