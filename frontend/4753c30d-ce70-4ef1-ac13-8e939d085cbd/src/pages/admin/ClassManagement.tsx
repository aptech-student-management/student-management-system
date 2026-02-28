import React, { useMemo, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { useToast } from '../../contexts/ToastContext';
import { classes as initialClasses, departments } from '../../data/mockData';
import type { Class } from '../../types';
const PAGE_SIZE = 8;
export function ClassManagement() {
  const { showToast } = useToast();
  const [classList, setClassList] = useState<Class[]>(initialClasses);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Class | null>(null);
  const [editing, setEditing] = useState<Class | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    departmentId: '',
    year: new Date().getFullYear().toString()
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const filtered = useMemo(() => {
    let result = classList;
    if (search)
    result = result.filter(
      (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    );
    if (filterDept) result = result.filter((c) => c.departmentId === filterDept);
    return result;
  }, [classList, search, filterDept]);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const getDeptName = (id: string) =>
  departments.find((d) => d.id === id)?.name ?? '—';
  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      code: '',
      departmentId: '',
      year: new Date().getFullYear().toString()
    });
    setFormErrors({});
    setModalOpen(true);
  };
  const openEdit = (cls: Class) => {
    setEditing(cls);
    setForm({
      name: cls.name,
      code: cls.code,
      departmentId: cls.departmentId,
      year: cls.year.toString()
    });
    setFormErrors({});
    setModalOpen(true);
  };
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên lớp';
    if (!form.code.trim()) errs.code = 'Vui lòng nhập mã lớp';
    if (!form.departmentId) errs.departmentId = 'Vui lòng chọn khoa';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (editing) {
      setClassList((prev) =>
      prev.map((c) =>
      c.id === editing.id ?
      {
        ...c,
        ...form,
        year: parseInt(form.year)
      } :
      c
      )
      );
      showToast('Cập nhật lớp thành công!', 'success');
    } else {
      setClassList((prev) => [
      ...prev,
      {
        id: `c${Date.now()}`,
        name: form.name,
        code: form.code,
        departmentId: form.departmentId,
        year: parseInt(form.year),
        studentCount: 0
      }]
      );
      showToast('Thêm lớp mới thành công!', 'success');
    }
    setLoading(false);
    setModalOpen(false);
  };
  const handleDelete = async () => {
    if (!deleteModal) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setClassList((prev) => prev.filter((c) => c.id !== deleteModal.id));
    showToast('Đã xóa lớp thành công!', 'success');
    setLoading(false);
    setDeleteModal(null);
  };
  const columns = [
  {
    key: 'name',
    label: 'Tên lớp',
    render: (_: unknown, row: Class) =>
    <span className="font-medium text-slate-900">{row.name}</span>

  },
  {
    key: 'code',
    label: 'Mã lớp',
    render: (_: unknown, row: Class) =>
    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded font-semibold text-slate-700">
          {row.code}
        </span>

  },
  {
    key: 'departmentId',
    label: 'Khoa',
    render: (_: unknown, row: Class) =>
    <span className="text-sm text-slate-600">
          {getDeptName(row.departmentId)}
        </span>

  },
  {
    key: 'year',
    label: 'Năm học',
    render: (_: unknown, row: Class) =>
    <span className="text-sm">{row.year}</span>

  },
  {
    key: 'studentCount',
    label: 'Số SV',
    render: (_: unknown, row: Class) =>
    <span className="font-semibold text-slate-800">{row.studentCount}</span>

  },
  {
    key: 'actions',
    label: 'Thao tác',
    render: (_: unknown, row: Class) =>
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
    <Layout title="Quản lý Lớp học">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <Input
              placeholder="Tìm kiếm lớp..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              icon={<SearchIcon className="w-4 h-4" />} />

          </div>
          <div className="w-48">
            <Select
              options={departments.map((d) => ({
                value: d.id,
                label: d.name
              }))}
              value={filterDept}
              onChange={(e) => {
                setFilterDept(e.target.value);
                setPage(1);
              }}
              placeholder="Tất cả khoa" />

          </div>
          <Button
            variant="primary"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={openAdd}>

            Thêm lớp
          </Button>
        </div>

        <Card padding={false}>
          <Table
            columns={columns as Parameters<typeof Table>[0]['columns']}
            data={paginated as Record<string, unknown>[]}
            emptyMessage="Không tìm thấy lớp nào"
            keyExtractor={(row) => (row as Class).id} />

          {totalPages > 1 &&
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE} />

          }
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Chỉnh sửa Lớp' : 'Thêm Lớp mới'}
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
            label="Tên lớp"
            placeholder="VD: CNTT K1 2022"
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
            label="Mã lớp"
            placeholder="VD: CNTT-K1-22"
            value={form.code}
            onChange={(e) =>
            setForm((p) => ({
              ...p,
              code: e.target.value
            }))
            }
            error={formErrors.code}
            required />

          <Select
            label="Khoa"
            options={departments.map((d) => ({
              value: d.id,
              label: d.name
            }))}
            value={form.departmentId}
            onChange={(e) =>
            setForm((p) => ({
              ...p,
              departmentId: e.target.value
            }))
            }
            error={formErrors.departmentId}
            placeholder="Chọn khoa"
            required />

          <Input
            label="Năm học"
            type="number"
            value={form.year}
            onChange={(e) =>
            setForm((p) => ({
              ...p,
              year: e.target.value
            }))
            }
            required />

        </div>
      </Modal>

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
          Bạn có chắc muốn xóa lớp{' '}
          <strong className="text-slate-900">{deleteModal?.name}</strong>?
        </p>
      </Modal>
    </Layout>);

}