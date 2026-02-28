import React, { useMemo, useState } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  UserIcon } from
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
import { users as initialUsers, departments } from '../../data/mockData';
import type { User, Role } from '../../types';
const PAGE_SIZE = 10;
const roleBadge = (role: Role) => {
  const map: Record<
    Role,
    {
      variant: 'info' | 'success' | 'neutral';
      label: string;
    }> =
  {
    ADMIN: {
      variant: 'info',
      label: 'Admin'
    },
    LECTURER: {
      variant: 'success',
      label: 'Giảng viên'
    },
    STUDENT: {
      variant: 'neutral',
      label: 'Sinh viên'
    }
  };
  return (
    <Badge variant={map[role].variant} dot>
      {map[role].label}
    </Badge>);

};
export function UserManagement() {
  const { showToast } = useToast();
  const [userList, setUserList] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | Role>('ALL');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'STUDENT' as Role,
    departmentId: '',
    phone: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const tabs: {
    key: 'ALL' | Role;
    label: string;
    count: number;
  }[] = [
  {
    key: 'ALL',
    label: 'Tất cả',
    count: userList.length
  },
  {
    key: 'ADMIN',
    label: 'Admin',
    count: userList.filter((u) => u.role === 'ADMIN').length
  },
  {
    key: 'LECTURER',
    label: 'Giảng viên',
    count: userList.filter((u) => u.role === 'LECTURER').length
  },
  {
    key: 'STUDENT',
    label: 'Sinh viên',
    count: userList.filter((u) => u.role === 'STUDENT').length
  }];

  const filtered = useMemo(() => {
    let result = userList;
    if (activeTab !== 'ALL') result = result.filter((u) => u.role === activeTab);
    if (search)
    result = result.filter(
      (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
    return result;
  }, [userList, activeTab, search]);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const getDeptName = (id?: string) =>
  id ? departments.find((d) => d.id === id)?.name ?? '—' : '—';
  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      email: '',
      role: 'STUDENT',
      departmentId: '',
      phone: '',
      password: ''
    });
    setFormErrors({});
    setModalOpen(true);
  };
  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      departmentId: u.departmentId ?? '',
      phone: u.phone ?? '',
      password: ''
    });
    setFormErrors({});
    setModalOpen(true);
  };
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập họ tên';
    if (!form.email.trim()) errs.email = 'Vui lòng nhập email';else
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errs.email = 'Email không hợp lệ';
    if (!editing && !form.password) errs.password = 'Vui lòng nhập mật khẩu';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (editing) {
      setUserList((prev) =>
      prev.map((u) =>
      u.id === editing.id ?
      {
        ...u,
        name: form.name,
        email: form.email,
        role: form.role,
        departmentId: form.departmentId,
        phone: form.phone
      } :
      u
      )
      );
      showToast('Cập nhật tài khoản thành công!', 'success');
    } else {
      const newUser: User = {
        id: `u${Date.now()}`,
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        departmentId: form.departmentId,
        phone: form.phone,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'ACTIVE'
      };
      setUserList((prev) => [...prev, newUser]);
      showToast('Thêm tài khoản thành công!', 'success');
    }
    setLoading(false);
    setModalOpen(false);
  };
  const handleDelete = async () => {
    if (!deleteModal) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setUserList((prev) => prev.filter((u) => u.id !== deleteModal.id));
    showToast('Đã xóa tài khoản!', 'success');
    setLoading(false);
    setDeleteModal(null);
  };
  const columns = [
  {
    key: 'name',
    label: 'Người dùng',
    render: (_: unknown, row: User) =>
    <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-900 text-sm">{row.name}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>

  },
  {
    key: 'role',
    label: 'Vai trò',
    render: (_: unknown, row: User) => roleBadge(row.role)
  },
  {
    key: 'departmentId',
    label: 'Khoa',
    render: (_: unknown, row: User) =>
    <span className="text-sm text-slate-600">
          {getDeptName(row.departmentId)}
        </span>

  },
  {
    key: 'studentId',
    label: 'Mã SV/GV',
    render: (_: unknown, row: User) =>
    <span className="text-xs text-slate-500 font-mono">
          {row.studentId ?? row.lecturerId ?? '—'}
        </span>

  },
  {
    key: 'createdAt',
    label: 'Ngày tạo',
    render: (_: unknown, row: User) =>
    <span className="text-xs text-slate-500">{row.createdAt}</span>

  },
  {
    key: 'status',
    label: 'Trạng thái',
    render: (_: unknown, row: User) =>
    <Badge variant={row.status === 'ACTIVE' ? 'success' : 'error'} dot>
          {row.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu'}
        </Badge>

  },
  {
    key: 'actions',
    label: 'Thao tác',
    render: (_: unknown, row: User) =>
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
    <Layout title="Quản lý Tài khoản">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {tabs.map((tab) =>
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

              {tab.label}{' '}
              <span className="ml-1 text-xs text-slate-400">({tab.count})</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <Input
              placeholder="Tìm theo tên, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              icon={<SearchIcon className="w-4 h-4" />} />

          </div>
          <Button
            variant="primary"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={openAdd}>

            Thêm tài khoản
          </Button>
        </div>

        <Card padding={false}>
          <Table
            columns={columns as Parameters<typeof Table>[0]['columns']}
            data={paginated as Record<string, unknown>[]}
            emptyMessage="Không tìm thấy tài khoản nào"
            keyExtractor={(row) => (row as User).id} />

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
        title={editing ? 'Chỉnh sửa Tài khoản' : 'Thêm Tài khoản mới'}
        size="lg"
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
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
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
            label="Email"
            type="email"
            placeholder="example@uni.edu.vn"
            value={form.email}
            onChange={(e) =>
            setForm((p) => ({
              ...p,
              email: e.target.value
            }))
            }
            error={formErrors.email}
            required />

          {!editing &&
          <Input
            label="Mật khẩu"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            value={form.password}
            onChange={(e) =>
            setForm((p) => ({
              ...p,
              password: e.target.value
            }))
            }
            error={formErrors.password}
            required />

          }
          <Select
            label="Vai trò"
            options={[
            {
              value: 'ADMIN',
              label: 'Quản trị viên'
            },
            {
              value: 'LECTURER',
              label: 'Giảng viên'
            },
            {
              value: 'STUDENT',
              label: 'Sinh viên'
            }]
            }
            value={form.role}
            onChange={(e) =>
            setForm((p) => ({
              ...p,
              role: e.target.value as Role
            }))
            }
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
            placeholder="Chọn khoa (nếu có)" />

          <Input
            label="Số điện thoại"
            placeholder="09xxxxxxxx"
            value={form.phone}
            onChange={(e) =>
            setForm((p) => ({
              ...p,
              phone: e.target.value
            }))
            } />

        </div>
      </Modal>

      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Xác nhận xóa tài khoản"
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
          Bạn có chắc muốn xóa tài khoản{' '}
          <strong className="text-slate-900">{deleteModal?.name}</strong>? Hành
          động này không thể hoàn tác.
        </p>
      </Modal>
    </Layout>);

}