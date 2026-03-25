import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { formatVNDate } from "../../utils/date";
import { buildScheduleValue, DEFAULT_TIME_SLOT, parseScheduleValue, TIME_SLOTS } from "../../utils/schedule";
import {
  createSemesterApi,
  deleteSemesterApi,
  getSemestersApi,
  updateSemesterApi } from
'../../services/semesterService';
import {
  createCourseSectionApi,
  deleteCourseSectionApi,
  getCourseSectionsApi,
  updateCourseSectionApi } from
'../../services/courseSectionService';
import { getSubjectsApi } from '../../services/subjectService';
import { getClassesApi } from '../../services/classService';
import { getAdminUsersApi } from '../../services/adminUserService';
import type { Semester, CourseSection, Subject, Class, User } from '../../types';
const semesterStatusBadge = (status: Semester['status']) => {
  const map = {
    ACTIVE: {
      v: 'success' as const,
      l: 'Đang diễn ra'
    },
    UPCOMING: {
      v: 'warning' as const,
      l: 'Sắp tới'
    },
    CLOSED: {
      v: 'neutral' as const,
      l: 'Đã kết thúc'
    }
  };
  return (
    <Badge variant={map[status].v} dot>
      {map[status].l}
    </Badge>);

};
const sectionStatusBadge = (status: CourseSection['status']) => {
  const map = {
    OPEN: {
      v: 'success' as const,
      l: 'Mở'
    },
    FULL: {
      v: 'warning' as const,
      l: 'Đầy'
    },
    CLOSED: {
      v: 'neutral' as const,
      l: 'Đóng'
    }
  };
  return (
    <Badge variant={map[status].v} dot>
      {map[status].l}
    </Badge>);

};
export function SemesterManagement() {
  const { showToast } = useToast();
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [sectionList, setSectionList] = useState<CourseSection[]>([]);
  const [activeTab, setActiveTab] = useState<'semesters' | 'sections'>(
    'semesters'
  );
  // Semester modal
  const [semModal, setSemModal] = useState(false);
  const [editingSem, setEditingSem] = useState<Semester | null>(null);
  const [semForm, setSemForm] = useState({
    name: '',
    year: '',
    startDate: '',
    endDate: ''
  });
  // Section modal
  const [secModal, setSecModal] = useState(false);
  const [editingSec, setEditingSec] = useState<CourseSection | null>(null);
  const [secForm, setSecForm] = useState({
    subjectId: '',
    semesterId: '',
    lecturerId: '',
    classId: '',
    scheduleDate: '',
    timeRange: DEFAULT_TIME_SLOT,
    room: '',
    maxStudents: '45'
  });
  const [loading, setLoading] = useState(false);
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [classList, setClassList] = useState<Class[]>([]);
  const [lecturerList, setLecturerList] = useState<User[]>([]);
  const [semesterFilters, setSemesterFilters] = useState({
    keyword: '',
    year: '',
    status: ''
  });
  const [sectionFilters, setSectionFilters] = useState({
    keyword: '',
    semesterId: '',
    status: ''
  });
  const [deleteModal, setDeleteModal] = useState<{
    type: 'sem' | 'sec';
    item: Semester | CourseSection;
  } | null>(null);

  const fetchSemesterData = async () => {
    try {
      const [semesters, sections, subjects, classes, users] = await Promise.all([
      getSemestersApi(),
      getCourseSectionsApi(),
      getSubjectsApi(),
      getClassesApi(),
      getAdminUsersApi()]
      );

      setSemesterList(semesters);
      setSectionList(sections);
      setSubjectList(subjects);
      setClassList(classes);
      setLecturerList(users.filter((u) => u.role === 'LECTURER'));
    } catch {
      showToast('Không thể tải dữ liệu học kỳ/lớp học phần', 'error');
    }
  };

  useEffect(() => {
    fetchSemesterData();
  }, []);
  const getSubjectName = (id: string) =>
  subjectList.find((s) => s.id === id)?.name ?? '—';
  const getLecturerName = (id: string) =>
  lecturerList.find((u) => u.id === id)?.name ?? '—';
  const getClassName = (id: string) =>
  classList.find((c) => c.id === id)?.name ?? '—';
  const getSemesterName = (id: string) =>
  semesterList.find((s) => s.id === id)?.name ?? '—';
  const filteredSemesters = useMemo(() => {
    const keyword = semesterFilters.keyword.trim().toLowerCase();

    return semesterList.filter((semester) => {
      const matchesKeyword =
      !keyword ||
      semester.name.toLowerCase().includes(keyword) ||
      semester.year.toLowerCase().includes(keyword);
      const matchesYear =
      !semesterFilters.year ||
      semester.year === semesterFilters.year;
      const matchesStatus =
      !semesterFilters.status ||
      semester.status === semesterFilters.status;

      return matchesKeyword && matchesYear && matchesStatus;
    });
  }, [semesterFilters, semesterList]);
  const filteredSections = useMemo(() => {
    const keyword = sectionFilters.keyword.trim().toLowerCase();

    return sectionList.filter((section) => {
      const subjectName = getSubjectName(section.subjectId).toLowerCase();
      const className = getClassName(section.classId).toLowerCase();
      const lecturerName = getLecturerName(section.lecturerId).toLowerCase();
      const scheduleText = section.schedule.toLowerCase();
      const matchesKeyword =
      !keyword ||
      subjectName.includes(keyword) ||
      className.includes(keyword) ||
      lecturerName.includes(keyword) ||
      scheduleText.includes(keyword) ||
      section.room.toLowerCase().includes(keyword);
      const matchesSemester =
      !sectionFilters.semesterId ||
      section.semesterId === sectionFilters.semesterId;
      const matchesStatus =
      !sectionFilters.status ||
      section.status === sectionFilters.status;

      return matchesKeyword && matchesSemester && matchesStatus;
    });
  }, [getClassName, getLecturerName, getSubjectName, sectionFilters, sectionList]);
  const semesterYearOptions = useMemo(
    () =>
    [...new Set(semesterList.map((semester) => semester.year))].
    filter(Boolean).
    map((year) => ({
      value: year,
      label: year
    })),
    [semesterList]
  );
  const openAddSem = () => {
    setEditingSem(null);
    setSemForm({
      name: '',
      year: '',
      startDate: '',
      endDate: ''
    });
    setSemModal(true);
  };
  const openEditSem = (s: Semester) => {
    setEditingSem(s);
    setSemForm({
      name: s.name,
      year: s.year,
      startDate: s.startDate,
      endDate: s.endDate
    });
    setSemModal(true);
  };
  const openAddSec = () => {
    setEditingSec(null);
    setSecForm({
      subjectId: '',
      semesterId: '',
      lecturerId: '',
      classId: '',
      scheduleDate: '',
      timeRange: DEFAULT_TIME_SLOT,
      room: '',
      maxStudents: '45'
    });
    setSecModal(true);
  };
  const openEditSec = (s: CourseSection) => {
    const parsedSchedule = parseScheduleValue(s.schedule);
    setEditingSec(s);
    setSecForm({
      subjectId: s.subjectId,
      semesterId: s.semesterId,
      lecturerId: s.lecturerId,
      classId: s.classId,
      scheduleDate: parsedSchedule.scheduleDate,
      timeRange: parsedSchedule.timeRange || DEFAULT_TIME_SLOT,
      room: s.room,
      maxStudents: s.maxStudents.toString()
    });
    setSecModal(true);
  };
  const handleSaveSem = async () => {
    setLoading(true);

    try {
      if (editingSem) {
        await updateSemesterApi(editingSem.id, {
          name: semForm.name,
          academicYear: semForm.year,
          startDate: semForm.startDate,
          endDate: semForm.endDate
        });
        showToast('Cập nhật học kỳ thành công!', 'success');
      } else {
        await createSemesterApi({
          name: semForm.name,
          academicYear: semForm.year,
          startDate: semForm.startDate,
          endDate: semForm.endDate
        });
        showToast('Thêm học kỳ thành công!', 'success');
      }

      await fetchSemesterData();
      setSemModal(false);
    } catch {
      showToast('Lưu học kỳ thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleSaveSec = async () => {
    setLoading(true);

    const schedule = buildScheduleValue(secForm.scheduleDate, secForm.timeRange);

    try {
      if (editingSec) {
        await updateCourseSectionApi(editingSec.id, {
          subjectId: secForm.subjectId,
          semesterId: secForm.semesterId,
          lecturerId: secForm.lecturerId,
          classId: secForm.classId,
          schedule,
          room: secForm.room,
          maxStudents: parseInt(secForm.maxStudents),
          enrolledCount: editingSec.enrolledCount
        });
        showToast('Cập nhật lớp học phần thành công!', 'success');
      } else {
        await createCourseSectionApi({
          subjectId: secForm.subjectId,
          semesterId: secForm.semesterId,
          lecturerId: secForm.lecturerId,
          classId: secForm.classId,
          schedule,
          room: secForm.room,
          maxStudents: parseInt(secForm.maxStudents),
          enrolledCount: 0
        });
        showToast('Mở lớp học phần thành công!', 'success');
      }

      await fetchSemesterData();
      setSecModal(false);
    } catch {
      showToast('Lưu lớp học phần thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteModal) return;
    setLoading(true);

    try {
      if (deleteModal.type === 'sem') {
        await deleteSemesterApi((deleteModal.item as Semester).id);
      } else {
        await deleteCourseSectionApi((deleteModal.item as CourseSection).id);
      }

      await fetchSemesterData();
      showToast('Đã xóa thành công!', 'success');
      setDeleteModal(null);
    } catch {
      showToast('Xóa thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };
  const semColumns = [
  {
    key: 'name',
    label: 'Tên học kỳ',
    render: (_: unknown, row: Semester) =>
    <span className="font-medium text-slate-900">{row.name}</span>

  },
  {
    key: 'year',
    label: 'Năm học',
    render: (_: unknown, row: Semester) =>
    <span className="text-sm text-slate-600">{row.year}</span>

  },
  {
  key: 'startDate',
  label: 'Bắt đầu',
  render: (_: unknown, row: Semester) =>
    <span className="text-sm">{formatVNDate(row.startDate)}</span>
  },
  {
    key: 'endDate',
    label: 'Kết thúc',
    render: (_: unknown, row: Semester) =>
    <span className="text-sm">{formatVNDate(row.endDate)}</span>

  },
  {
    key: 'status',
    label: 'Trạng thái',
    render: (_: unknown, row: Semester) => semesterStatusBadge(row.status)
  },
  {
    key: 'actions',
    label: 'Thao tác',
    render: (_: unknown, row: Semester) =>
    <div className="flex items-center gap-2">
          <Button
        variant="ghost"
        size="sm"
        icon={<PencilIcon className="w-3.5 h-3.5" />}
        onClick={() => openEditSem(row)}>

            Sửa
          </Button>
          <Button
        variant="ghost"
        size="sm"
        icon={<TrashIcon className="w-3.5 h-3.5" />}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={() =>
        setDeleteModal({
          type: 'sem',
          item: row
        })
        }>

            Xóa
          </Button>
        </div>

  }];

  const secColumns = [
  {
    key: 'subjectId',
    label: 'Môn học',
    render: (_: unknown, row: CourseSection) =>
    <span className="font-medium text-slate-900 text-sm">
          {getSubjectName(row.subjectId)}
        </span>

  },
  {
    key: 'semesterId',
    label: 'Học kỳ',
    render: (_: unknown, row: CourseSection) =>
    <span className="text-xs text-slate-600">
          {getSemesterName(row.semesterId)}
        </span>

  },
  {
    key: 'lecturerId',
    label: 'Giảng viên',
    render: (_: unknown, row: CourseSection) =>
    <span className="text-sm text-slate-700">
          {getLecturerName(row.lecturerId)}
        </span>

  },
  {
    key: 'classId',
    label: 'Lớp',
    render: (_: unknown, row: CourseSection) =>
    <span className="text-sm">{getClassName(row.classId)}</span>

  },
  {
    key: 'schedule',
    label: 'Lịch học',
    render: (_: unknown, row: CourseSection) => {
      const parsed = parseScheduleValue(row.schedule);
      return (
        <span className="text-xs text-slate-600">
          {parsed.dateLabel && parsed.timeLabel
            ? `${parsed.dayLabel} · ${parsed.dateLabel} · ${parsed.timeLabel}`
            : parsed.dayLabel && parsed.timeLabel
            ? `${parsed.dayLabel} · ${parsed.timeLabel}`
            : row.schedule}
        </span>
      );
    }

  },
  {
    key: 'room',
    label: 'Phòng',
    render: (_: unknown, row: CourseSection) =>
    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
          {row.room}
        </span>

  },
  {
    key: 'enrolledCount',
    label: 'Sĩ số',
    render: (_: unknown, row: CourseSection) =>
    <span className="text-sm font-medium">
          {row.enrolledCount}/{row.maxStudents}
        </span>

  },
  {
    key: 'status',
    label: 'Trạng thái',
    render: (_: unknown, row: CourseSection) =>
    sectionStatusBadge(row.status)
  },
  {
    key: 'actions',
    label: 'Thao tác',
    render: (_: unknown, row: CourseSection) =>
    <div className="flex items-center gap-2">
          <Button
        variant="ghost"
        size="sm"
        icon={<PencilIcon className="w-3.5 h-3.5" />}
        onClick={() => openEditSec(row)}>

            Sửa
          </Button>
          <Button
        variant="ghost"
        size="sm"
        icon={<TrashIcon className="w-3.5 h-3.5" />}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={() =>
        setDeleteModal({
          type: 'sec',
          item: row
        })
        }>

            Xóa
          </Button>
        </div>

  }];

  return (
    <Layout title="Học kỳ & Lớp học phần">
      <div className="space-y-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('semesters')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'semesters' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

            Học kỳ ({semesterList.length})
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'sections' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

            Lớp học phần ({sectionList.length})
          </button>
        </div>

        {activeTab === 'semesters' &&
        <>
            <div className="flex justify-end">
              <Button
              variant="primary"
              icon={<PlusIcon className="w-4 h-4" />}
              onClick={openAddSem}>

                Thêm học kỳ
              </Button>
            </div>
            <Card>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Input
                  label="Tìm học kỳ"
                  placeholder="Tên học kỳ hoặc năm học"
                  value={semesterFilters.keyword}
                  onChange={(e) =>
                  setSemesterFilters((prev) => ({
                    ...prev,
                    keyword: e.target.value
                  }))
                  } />
                <Select
                  label="Năm học"
                  options={semesterYearOptions}
                  value={semesterFilters.year}
                  onChange={(e) =>
                  setSemesterFilters((prev) => ({
                    ...prev,
                    year: e.target.value
                  }))
                  }
                  placeholder="Tất cả năm học" />
                <Select
                  label="Trạng thái"
                  options={[
                  {
                    value: 'UPCOMING',
                    label: 'Sắp tới'
                  },
                  {
                    value: 'ACTIVE',
                    label: 'Đang diễn ra'
                  },
                  {
                    value: 'CLOSED',
                    label: 'Đã kết thúc'
                  }]}
                  value={semesterFilters.status}
                  onChange={(e) =>
                  setSemesterFilters((prev) => ({
                    ...prev,
                    status: e.target.value
                  }))
                  }
                  placeholder="Tất cả trạng thái" />
              </div>
            </Card>
            <Card padding={false}>
              <Table
              columns={semColumns as Parameters<typeof Table>[0]['columns']}
              data={filteredSemesters as Record<string, unknown>[]}
              keyExtractor={(row) => (row as Semester).id} />

            </Card>
          </>
        }

        {activeTab === 'sections' &&
        <>
            <div className="flex justify-end">
              <Button
              variant="primary"
              icon={<PlusIcon className="w-4 h-4" />}
              onClick={openAddSec}>

                Mở lớp học phần
              </Button>
            </div>
            <Card>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Input
                  label="Tìm lớp học phần"
                  placeholder="Môn học, lớp, giảng viên, phòng"
                  value={sectionFilters.keyword}
                  onChange={(e) =>
                  setSectionFilters((prev) => ({
                    ...prev,
                    keyword: e.target.value
                  }))
                  } />
                <Select
                  label="Học kỳ"
                  options={semesterList.map((semester) => ({
                    value: semester.id,
                    label: `${semester.name} - ${semester.year}`
                  }))}
                  value={sectionFilters.semesterId}
                  onChange={(e) =>
                  setSectionFilters((prev) => ({
                    ...prev,
                    semesterId: e.target.value
                  }))
                  }
                  placeholder="Tất cả học kỳ" />
                <Select
                  label="Trạng thái"
                  options={[
                  {
                    value: 'OPEN',
                    label: 'Mở'
                  },
                  {
                    value: 'FULL',
                    label: 'Đầy'
                  },
                  {
                    value: 'CLOSED',
                    label: 'Đóng'
                  }]}
                  value={sectionFilters.status}
                  onChange={(e) =>
                  setSectionFilters((prev) => ({
                    ...prev,
                    status: e.target.value
                  }))
                  }
                  placeholder="Tất cả trạng thái" />
              </div>
            </Card>
            <Card padding={false}>
              <Table
              columns={secColumns as Parameters<typeof Table>[0]['columns']}
              data={filteredSections as Record<string, unknown>[]}
              keyExtractor={(row) => (row as CourseSection).id} />

            </Card>
          </>
        }
      </div>

      {/* Semester Modal */}
      <Modal
        isOpen={semModal}
        onClose={() => setSemModal(false)}
        title={editingSem ? 'Chỉnh sửa Học kỳ' : 'Thêm Học kỳ mới'}
        footer={
        <>
            <Button variant="outline" onClick={() => setSemModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={loading} onClick={handleSaveSem}>
              {editingSem ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </>
        }>

        <div className="space-y-4">
          <Input
            label="Tên học kỳ"
            placeholder="VD: Học kỳ 1 2024-2025"
            value={semForm.name}
            onChange={(e) =>
            setSemForm((p) => ({
              ...p,
              name: e.target.value
            }))
            }
            required />

          <Input
            label="Năm học"
            placeholder="VD: 2024-2025"
            value={semForm.year}
            onChange={(e) =>
            setSemForm((p) => ({
              ...p,
              year: e.target.value
            }))
            }
            required />

          <Input
            label="Ngày bắt đầu"
            type="date"
            value={semForm.startDate}
            onChange={(e) =>
            setSemForm((p) => ({
              ...p,
              startDate: e.target.value
            }))
            }
            required />

          <Input
            label="Ngày kết thúc"
            type="date"
            value={semForm.endDate}
            onChange={(e) =>
            setSemForm((p) => ({
              ...p,
              endDate: e.target.value
            }))
            }
            required />

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Trạng thái học kỳ được tự động cập nhật theo ngày bắt đầu và ngày kết thúc.
          </div>

        </div>
      </Modal>

      {/* Section Modal */}
      <Modal
        isOpen={secModal}
        onClose={() => setSecModal(false)}
        title={editingSec ? 'Chỉnh sửa Lớp học phần' : 'Mở Lớp học phần mới'}
        size="lg"
        footer={
        <>
            <Button variant="outline" onClick={() => setSecModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={loading} onClick={handleSaveSec}>
              {editingSec ? 'Cập nhật' : 'Mở lớp'}
            </Button>
          </>
        }>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Select
              label="Môn học"
              options={subjectList.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.code})`
              }))}
              value={secForm.subjectId}
              onChange={(e) =>
              setSecForm((p) => ({
                ...p,
                subjectId: e.target.value
              }))
              }
              placeholder="Chọn môn học"
              required />

          </div>
          <Select
            label="Học kỳ"
            options={semesterList.map((s) => ({
              value: s.id,
              label: s.name
            }))}
            value={secForm.semesterId}
            onChange={(e) =>
            setSecForm((p) => ({
              ...p,
              semesterId: e.target.value
            }))
            }
            placeholder="Chọn học kỳ"
            required />

          <Select
            label="Giảng viên"
            options={lecturerList.map((l) => ({
              value: l.id,
              label: l.name
            }))}
            value={secForm.lecturerId}
            onChange={(e) =>
            setSecForm((p) => ({
              ...p,
              lecturerId: e.target.value
            }))
            }
            placeholder="Chọn giảng viên"
            required />

          <Select
            label="Lớp"
            options={classList.map((c) => ({
              value: c.id,
              label: c.name
            }))}
            value={secForm.classId}
            onChange={(e) =>
            setSecForm((p) => ({
              ...p,
              classId: e.target.value
            }))
            }
            placeholder="Chọn lớp"
            required />

          <Input
            label="Phòng học"
            placeholder="VD: A101"
            value={secForm.room}
            onChange={(e) =>
            setSecForm((p) => ({
              ...p,
              room: e.target.value
            }))
            }
            required />

          <Input
            label="Ngày học"
            type="date"
            value={secForm.scheduleDate}
            onChange={(e) =>
            setSecForm((p) => ({
              ...p,
              scheduleDate: e.target.value
            }))
            }
            required />

          <Select
            label="Khung giờ"
            options={TIME_SLOTS.map((slot) => ({
              value: slot.value,
              label: slot.label
            }))}
            value={secForm.timeRange}
            onChange={(e) =>
            setSecForm((p) => ({
              ...p,
              timeRange: e.target.value
            }))
            }
            placeholder="Chọn ca học"
            required />

          <Input
            label="Sĩ số tối đa"
            type="number"
            value={secForm.maxStudents}
            onChange={(e) =>
            setSecForm((p) => ({
              ...p,
              maxStudents: e.target.value
            }))
            }
            required />

          <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Lịch tạo ra:{" "}
            <span className="font-medium text-slate-900">
              {secForm.scheduleDate ? (() => {
                const preview = parseScheduleValue(
                  buildScheduleValue(secForm.scheduleDate, secForm.timeRange)
                );
                return `${preview.dayLabel} · ${preview.dateLabel} · ${preview.timeLabel}`;
              })() : "Chọn ngày và khung giờ"}
            </span>
          </div>

        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Xác nhận xóa"
        size="sm"
        footer={
        <>
            <Button variant="outline" onClick={() => setDeleteModal(null)}>
              Hủy
            </Button>
            <Button variant="danger" loading={loading} onClick={handleDelete}>
              Xóa
            </Button>
          </>
        }>

        <p className="text-sm text-slate-600">Bạn có chắc muốn xóa mục này?</p>
      </Modal>
    </Layout>);

}
