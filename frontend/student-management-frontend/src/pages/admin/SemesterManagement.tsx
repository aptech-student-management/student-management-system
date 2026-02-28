import React, { useMemo, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import {
  semesters as initialSemesters,
  courseSections as initialSections,
  subjects,
  users,
  classes } from
'../../data/mockData';
import type { Semester, CourseSection } from '../../types';
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
  const [semesterList, setSemesterList] = useState<Semester[]>(initialSemesters);
  const [sectionList, setSectionList] =
  useState<CourseSection[]>(initialSections);
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
    endDate: '',
    status: 'UPCOMING' as Semester['status']
  });
  // Section modal
  const [secModal, setSecModal] = useState(false);
  const [editingSec, setEditingSec] = useState<CourseSection | null>(null);
  const [secForm, setSecForm] = useState({
    subjectId: '',
    semesterId: '',
    lecturerId: '',
    classId: '',
    schedule: '',
    room: '',
    maxStudents: '45'
  });
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    type: 'sem' | 'sec';
    item: Semester | CourseSection;
  } | null>(null);
  const lecturers = users.filter((u) => u.role === 'LECTURER');
  const getSubjectName = (id: string) =>
  subjects.find((s) => s.id === id)?.name ?? '—';
  const getLecturerName = (id: string) =>
  users.find((u) => u.id === id)?.name ?? '—';
  const getClassName = (id: string) =>
  classes.find((c) => c.id === id)?.name ?? '—';
  const getSemesterName = (id: string) =>
  semesterList.find((s) => s.id === id)?.name ?? '—';
  const openAddSem = () => {
    setEditingSem(null);
    setSemForm({
      name: '',
      year: '',
      startDate: '',
      endDate: '',
      status: 'UPCOMING'
    });
    setSemModal(true);
  };
  const openEditSem = (s: Semester) => {
    setEditingSem(s);
    setSemForm({
      name: s.name,
      year: s.year,
      startDate: s.startDate,
      endDate: s.endDate,
      status: s.status
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
      schedule: '',
      room: '',
      maxStudents: '45'
    });
    setSecModal(true);
  };
  const openEditSec = (s: CourseSection) => {
    setEditingSec(s);
    setSecForm({
      subjectId: s.subjectId,
      semesterId: s.semesterId,
      lecturerId: s.lecturerId,
      classId: s.classId,
      schedule: s.schedule,
      room: s.room,
      maxStudents: s.maxStudents.toString()
    });
    setSecModal(true);
  };
  const handleSaveSem = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (editingSem) {
      setSemesterList((prev) =>
      prev.map((s) =>
      s.id === editingSem.id ?
      {
        ...s,
        ...semForm
      } :
      s
      )
      );
      showToast('Cập nhật học kỳ thành công!', 'success');
    } else {
      setSemesterList((prev) => [
      ...prev,
      {
        id: `sem${Date.now()}`,
        ...semForm
      }]
      );
      showToast('Thêm học kỳ thành công!', 'success');
    }
    setLoading(false);
    setSemModal(false);
  };
  const handleSaveSec = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (editingSec) {
      setSectionList((prev) =>
      prev.map((s) =>
      s.id === editingSec.id ?
      {
        ...s,
        ...secForm,
        maxStudents: parseInt(secForm.maxStudents)
      } :
      s
      )
      );
      showToast('Cập nhật lớp học phần thành công!', 'success');
    } else {
      setSectionList((prev) => [
      ...prev,
      {
        id: `cs${Date.now()}`,
        ...secForm,
        maxStudents: parseInt(secForm.maxStudents),
        enrolledCount: 0,
        status: 'OPEN' as const
      }]
      );
      showToast('Mở lớp học phần thành công!', 'success');
    }
    setLoading(false);
    setSecModal(false);
  };
  const handleDelete = async () => {
    if (!deleteModal) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    if (deleteModal.type === 'sem') {
      setSemesterList((prev) =>
      prev.filter((s) => s.id !== (deleteModal.item as Semester).id)
      );
    } else {
      setSectionList((prev) =>
      prev.filter((s) => s.id !== (deleteModal.item as CourseSection).id)
      );
    }
    showToast('Đã xóa thành công!', 'success');
    setLoading(false);
    setDeleteModal(null);
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
    <span className="text-sm">{row.startDate}</span>

  },
  {
    key: 'endDate',
    label: 'Kết thúc',
    render: (_: unknown, row: Semester) =>
    <span className="text-sm">{row.endDate}</span>

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
    render: (_: unknown, row: CourseSection) =>
    <span className="text-xs text-slate-600">{row.schedule}</span>

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
            <Card padding={false}>
              <Table
              columns={semColumns as Parameters<typeof Table>[0]['columns']}
              data={semesterList as Record<string, unknown>[]}
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
            <Card padding={false}>
              <Table
              columns={secColumns as Parameters<typeof Table>[0]['columns']}
              data={sectionList as Record<string, unknown>[]}
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

          <Select
            label="Trạng thái"
            options={[
            {
              value: 'ACTIVE',
              label: 'Đang diễn ra'
            },
            {
              value: 'UPCOMING',
              label: 'Sắp tới'
            },
            {
              value: 'CLOSED',
              label: 'Đã kết thúc'
            }]
            }
            value={semForm.status}
            onChange={(e) =>
            setSemForm((p) => ({
              ...p,
              status: e.target.value as Semester['status']
            }))
            }
            required />

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
              options={subjects.map((s) => ({
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
            options={lecturers.map((l) => ({
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
            options={classes.map((c) => ({
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

          <div className="col-span-2">
            <Input
              label="Lịch học"
              placeholder="VD: Thứ 2 (Tiết 1-3)"
              value={secForm.schedule}
              onChange={(e) =>
              setSecForm((p) => ({
                ...p,
                schedule: e.target.value
              }))
              }
              required />

          </div>
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