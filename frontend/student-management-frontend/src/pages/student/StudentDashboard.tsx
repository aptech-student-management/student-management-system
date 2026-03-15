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
import { getEarlyWarningApi } from "../../services/earlyWarningService";
import type { EarlyWarning } from "../../types";

import {
  enrollments,
  courseSections,
  subjects,
  grades,
  semesters
} from "../../data/mockData";

const TOTAL_CREDITS_REQUIRED = 120;

export function StudentDashboard() {

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [earlyWarning, setEarlyWarning] = useState<EarlyWarning | null>(null);

  const myEnrollments = useMemo(
    () =>
      enrollments.filter(
        (e) => e.studentId === currentUser?.id && e.status === "ENROLLED"
      ),
    [currentUser]
  );

  const activeSemester = semesters.find((s) => s.status === "ACTIVE");

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

  const gpaHistory = [
    { name: "HK1 22-23", GPA: 3.2 },
    { name: "HK2 22-23", GPA: 3.4 },
    { name: "HK1 23-24", GPA: cumulativeGPA ?? 3.5 },
    { name: "HK1 24-25", GPA: currentSemGPA ?? 3.3 }
  ];

  const creditProgress = Math.min(
    (completedCredits / TOTAL_CREDITS_REQUIRED) * 100,
    100
  );

  useEffect(() => {
    const loadEarlyWarning = async () => {
      if (!currentUser?.studentId) return;
      try {
        const data = await getEarlyWarningApi(currentUser.studentId);
        setEarlyWarning(data);
      } catch {
        setEarlyWarning(null);
      }
    };

    void loadEarlyWarning();
  }, [currentUser?.studentId]);

  const riskBadgeClass =
    earlyWarning?.riskLevel === "HIGH"
      ? "bg-red-100 text-red-700 border-red-200"
      : earlyWarning?.riskLevel === "MEDIUM"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-emerald-100 text-emerald-700 border-emerald-200";

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
              <span>0</span>
              <span>{TOTAL_CREDITS_REQUIRED} TC</span>
            </div>

          </div>

        </Card>

        {earlyWarning && (
          <Card
            title="AI Early Warning"
            subtitle="Đánh giá nguy cơ học tập theo dữ liệu điểm và chuyên cần"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={riskBadgeClass}>
                  Mức nguy cơ: {earlyWarning.riskLevel}
                </Badge>
                <Badge variant="info">
                  Điểm rủi ro: {earlyWarning.riskScore.toFixed(1)}/100
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-slate-500">Tỷ lệ chuyên cần</p>
                  <p className="font-semibold text-slate-800">
                    {(earlyWarning.attendanceRate * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-slate-500">GPA trung bình</p>
                  <p className="font-semibold text-slate-800">
                    {earlyWarning.averageGpa?.toFixed(2) ?? "N/A"}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-slate-500">Môn có nguy cơ trượt</p>
                  <p className="font-semibold text-slate-800">
                    {earlyWarning.failedCourseCount}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Gợi ý từ AI</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                  {earlyWarning.recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

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

          <Card
            title="Xu hướng GPA"
            subtitle="4 học kỳ gần nhất"
          >

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
