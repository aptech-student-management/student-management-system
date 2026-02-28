import React, { useMemo, useState } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  BookOpenIcon } from
'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { subjects as initialSubjects, departments } from '../../data/mockData';
import type { Subject } from '../../types';
const PAGE_SIZE = 8;
export function SubjectManagement() {
  const { showToast } = useToast();
  const [subjectList, setSubjectList] = useState<Subject[]>(initialSubjects);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [sortCredits, setSortCredits] = useState<'asc' | 'desc' | ''>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Subject | null>(null);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    credits: '3',
    departmentId: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const filtered = useMemo(() => {
    let result = subjectList;
    if (search)
    result = result.filter(
      (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
    );
    if (filterDept) result = result.filter((s) => s.departmentId === filterDept);
    if (sortCredits === 'asc')
    result = [...result].sort((a, b) => a.credits - b.credits);
    if (sortCredits === 'desc')
    result = [...result].sort((a, b) => b.credits - a.credits);
    return result;
  }, [subjectList, search, filterDept, sortCredits]);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const getDeptName = (id: string) =>
  departments.find((d) => d.id === id)?.name ?? '—';
  const creditBadge = (credits: number) => {
    const variant = credits >= 4 ? 'purple' : credits === 3 ? 'info' : 'neutral';
    return (
      <Badge variant={variant as 'info' | 'neutral' | 'purple'}>
        {credits} TC
      </Badge>);

  };
  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      code: '',
      credits: '3',
      departmentId: '',
      description: ''
    });
    setFormErrors({});
    setModalOpen(true);
  };
  const openEdit = (s: Subject) => {
    setEditing(s);
    setForm({
      name: s.name,
      code: s.code,
      credits: s.credits.toString(),
      departmentId: s.departmentId,
      description: s.description ?? ''
    });
    setFormErrors({});
    setModalOpen(true);
  };
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên môn';
    if (!form.code.trim()) errs.code = 'Vui lòng nhập mã môn';
    if (!form.departmentId) errs.departmentId = 'Vui lòng chọn khoa';
    const cr = parseInt(form.credits);
    if (isNaN(cr) || cr < 1 || cr > 6) errs.credits = 'Số tín chỉ từ 1-6';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (editing) {
      setSubjectList((prev) =>
      prev.map((s) =>
      s.id === editing.id ?
      {
        ...s,
        ...form,
        credits: parseInt(form.credits)
      } :
      s
      )
      );
      showToast('Cập nhật môn học thành công!', 'success');
    } else {
      setSubjectList((prev) => [
      ...prev,
      {
        id: `s${Date.now()}`,
        name: form.name,
        code: form.code,
        credits: parseInt(form.credits),
        departmentId: form.departmentId,
        description: form.description
      }]
      );
      showToast('Thêm môn học thành công!', 'success');
    }
    setLoading(false);
    setModalOpen(false);
  };
  const handleDelete = async () => {
    if (!deleteModal) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setSubjectList((prev) => prev.filter((s) => s.id !== deleteModal.id));
    showToast('Đã xóa môn học!', 'success');
    setLoading(false);
    setDeleteModal(null);
  };
  const columns = [
  {
    key: 'name',
    label: 'Tên môn học',
    render: (_: unknown, row: Subject) =>
    <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <BookOpenIcon className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900 text-sm">{row.name}</p>
            <p className="text-xs text-slate-500">{row.description}</p>
          </div>
        </div>

  },
  {
    key: 'code',
    label: 'Mã môn',
    render: (_: unknown, row: Subject) =>
    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded font-semibold text-slate-700">
          {row.code}
        </span>

  },
  {
    key: 'credits',
    label: 'Tín chỉ',
    render: (_: unknown, row: Subject) => creditBadge(row.credits)
  },
  {
    key: 'departmentId',
    label: 'Khoa',
    render: (_: unknown, row: Subject) =>
    <span className="text-sm text-slate-600">
          {getDeptName(row.departmentId)}
        </span>

  },
  {
    key: 'actions',
    label: 'Thao tác',
    render: (_: unknown, row: Subject) =>
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
    <Layout title="Quản lý Môn học">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <Input
              placeholder="Tìm kiếm môn học..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              icon={<SearchIcon className="w-4 h-4" />} />

          </div>
          <div className="w-44">
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
          <div className="w-40">
            <Select
              options={[
              {
                value: 'asc',
                label: 'TC: Tăng dần'
              },
              {
                value: 'desc',
                label: 'TC: Giảm dần'
              }]
              }
              value={sortCredits}
              onChange={(e) =>
              setSortCredits(e.target.value as 'asc' | 'desc' | '')
              }
              placeholder="Sắp xếp TC" />

          </div>
          <Button
            variant="primary"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={openAdd}>

            Thêm môn
          </Button>
        </div>

        <Card padding={false}>
          <Table
            columns={columns as Parameters<typeof Table>[0]['columns']}
            data={paginated as Record<string, unknown>[]}
            emptyMessage="Không tìm thấy môn học nào"
            keyExtractor={(row) => (row as Subject).id} />

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
        title={editing ? 'Chỉnh sửa Môn học' : 'Thêm Môn học mới'}
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
            label="Tên môn học"
            placeholder="VD: Lập trình Hướng đối tượng"
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
            label="Mã môn"
            placeholder="VD: OOP101"
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
            label="Số tín chỉ"
            type="number"
            min="1"
            max="6"
            value={form.credits}
            onChange={(e) =>
            setForm((p) => ({
              ...p,
              credits: e.target.value
            }))
            }
            error={formErrors.credits}
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
            label="Mô tả"
            placeholder="Mô tả ngắn về môn học"
            value={form.description}
            onChange={(e) =>
            setForm((p) => ({
              ...p,
              description: e.target.value
            }))
            } />

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
          Bạn có chắc muốn xóa môn{' '}
          <strong className="text-slate-900">{deleteModal?.name}</strong>?
        </p>
      </Modal>
    </Layout>);

}