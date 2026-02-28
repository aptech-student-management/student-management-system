import React, { useMemo, useState } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  BuildingIcon } from
'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../contexts/ToastContext';
import { departments as initialDepts, users } from '../../data/mockData';
import type { Department } from '../../types';
export function DepartmentManagement() {
  const { showToast } = useToast();
  const [depts, setDepts] = useState<Department[]>(initialDepts);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Department | null>(null);
  const [editing, setEditing] = useState<Department | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const lecturers = users.filter((u) => u.role === 'LECTURER');
  const filtered = useMemo(
    () =>
    depts.filter(
      (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
    ),
    [depts, search]
  );
  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      code: '',
      description: ''
    });
    setFormErrors({});
    setModalOpen(true);
  };
  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({
      name: dept.name,
      code: dept.code,
      description: dept.description ?? ''
    });
    setFormErrors({});
    setModalOpen(true);
  };
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên khoa';
    if (!form.code.trim()) errs.code = 'Vui lòng nhập mã khoa';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (editing) {
      setDepts((prev) =>
      prev.map((d) =>
      d.id === editing.id ?
      {
        ...d,
        ...form
      } :
      d
      )
      );
      showToast('Cập nhật khoa thành công!', 'success');
    } else {
      const newDept: Department = {
        id: `d${Date.now()}`,
        name: form.name,
        code: form.code,
        description: form.description,
        studentCount: 0,
        subjectCount: 0
      };
      setDepts((prev) => [...prev, newDept]);
      showToast('Thêm khoa mới thành công!', 'success');
    }
    setLoading(false);
    setModalOpen(false);
  };
  const handleDelete = async () => {
    if (!deleteModal) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setDepts((prev) => prev.filter((d) => d.id !== deleteModal.id));
    showToast('Đã xóa khoa thành công!', 'success');
    setLoading(false);
    setDeleteModal(null);
  };
  const getLecturerName = (id?: string) => {
    if (!id) return '—';
    return lecturers.find((l) => l.id === id)?.name ?? '—';
  };
  const columns = [
  {
    key: 'name',
    label: 'Tên khoa',
    render: (_: unknown, row: Department) =>
    <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <BuildingIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900 text-sm">{row.name}</p>
            <p className="text-xs text-slate-500">{row.description}</p>
          </div>
        </div>

  },
  {
    key: 'code',
    label: 'Mã khoa',
    render: (_: unknown, row: Department) =>
    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded font-semibold text-slate-700">
          {row.code}
        </span>

  },
  {
    key: 'headLecturerId',
    label: 'Trưởng khoa',
    render: (_: unknown, row: Department) =>
    <span className="text-sm text-slate-700">
          {getLecturerName(row.headLecturerId)}
        </span>

  },
  {
    key: 'studentCount',
    label: 'Sinh viên',
    render: (_: unknown, row: Department) =>
    <span className="font-semibold text-slate-800">{row.studentCount}</span>

  },
  {
    key: 'subjectCount',
    label: 'Môn học',
    render: (_: unknown, row: Department) =>
    <span className="font-semibold text-slate-800">{row.subjectCount}</span>

  },
  {
    key: 'actions',
    label: 'Thao tác',
    render: (_: unknown, row: Department) =>
    <div className="flex items-center gap-2">
          <Button
        variant="ghost"
        size="sm"
        icon={<PencilIcon className="w-3.5 h-3.5" />}
        onClick={() => openEdit(row)}>

            Sửa
          </Button>
          <Button
        variant="ghost"
        size="sm"
        icon={<TrashIcon className="w-3.5 h-3.5" />}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={() => setDeleteModal(row)}>

            Xóa
          </Button>
        </div>

  }];

  return (
    <Layout title="Quản lý Khoa">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Tìm kiếm khoa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<SearchIcon className="w-4 h-4" />} />

          </div>
          <Button
            variant="primary"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={openAdd}>

            Thêm khoa
          </Button>
        </div>

        <Card padding={false}>
          <Table
            columns={columns as Parameters<typeof Table>[0]['columns']}
            data={filtered as Record<string, unknown>[]}
            emptyMessage="Không tìm thấy khoa nào"
            keyExtractor={(row) => (row as Department).id} />

        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Chỉnh sửa Khoa' : 'Thêm Khoa mới'}
        footer={
        <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={loading} onClick={handleSave}>
              {editing ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </>
        }>

        <div className="space-y-4">
          <Input
            label="Tên khoa"
            placeholder="VD: Khoa Công nghệ Thông tin"
            value={form.name}
            onChange={(e) =>
            setForm((p) => ({
              ...p,
              name: e.target.value
            }))
            }
            error={formErrors.name}
            required />

          <Input
            label="Mã khoa"
            placeholder="VD: CNTT"
            value={form.code}
            onChange={(e) =>
            setForm((p) => ({
              ...p,
              code: e.target.value.toUpperCase()
            }))
            }
            error={formErrors.code}
            required />

          <Input
            label="Mô tả"
            placeholder="Mô tả ngắn về khoa"
            value={form.description}
            onChange={(e) =>
            setForm((p) => ({
              ...p,
              description: e.target.value
            }))
            } />

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

        <p className="text-sm text-slate-600">
          Bạn có chắc muốn xóa khoa{' '}
          <strong className="text-slate-900">{deleteModal?.name}</strong>? Hành
          động này không thể hoàn tác.
        </p>
      </Modal>
    </Layout>);

}