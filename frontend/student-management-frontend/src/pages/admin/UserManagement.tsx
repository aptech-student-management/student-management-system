import React, { useEffect, useMemo, useState } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  UploadIcon } from
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
import type { User, Role } from '../../types';
import {
  applyAdminStudentImportApi,
  createAdminUserApi,
  deleteAdminUserApi,
  getAdminUsersApi,
  previewAdminStudentImportApi,
  type StudentImportRow,
  updateAdminUserApi } from
'../../services/adminUserService';
import { getDepartmentsApi } from '../../services/departmentService';
const PAGE_SIZE = 10;
type ImportableRole = Extract<Role, 'STUDENT' | 'LECTURER'>;

const importRoleOptions: { value: ImportableRole; label: string; badge: string }[] = [
  { value: 'STUDENT', label: 'Sinh viên', badge: 'SV' },
  { value: 'LECTURER', label: 'Giảng viên', badge: 'GV' }
];

const operationOptions: { value: StudentImportRow['operation']; label: string }[] = [
  { value: 'CREATE', label: 'Tạo mới' },
  { value: 'UPDATE', label: 'Cập nhật' }
];

const codeLabelByRole = (role: ImportableRole) =>
role === 'LECTURER' ? 'mã giảng viên' : 'mã sinh viên';

const codePlaceholderByRole = (role: ImportableRole) =>
role === 'LECTURER' ? 'VD: GV2026001' : 'VD: SV2026001';

const isBlockingImportIssue = (issue: string) => {
  const normalized = issue.toLowerCase();
  return (
    normalized.includes('thiếu') ||
    normalized.includes('không') ||
    normalized.includes('trùng') ||
    normalized.includes('hãy chọn') ||
    normalized.includes('khong') ||
    normalized.includes('trung')
  );
};

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
  const [userList, setUserList] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | Role>('ALL');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importRows, setImportRows] = useState<StudentImportRow[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importRole, setImportRole] = useState<ImportableRole>('STUDENT');
  const [defaultImportPassword, setDefaultImportPassword] = useState('123456');

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsersApi();
      setUserList(data);
    } catch {
      showToast('Không thể tải danh sách tài khoản', 'error');
    }
  };
  const fetchDepartments = async () => {
  try {
    const data = await getDepartmentsApi();
    setDepartments(data);
  } catch {
    showToast('Không thể tải danh sách khoa', 'error');
  }
};

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'STUDENT' as Role,
    departmentId: '',
    studentId: '',
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
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.studentId?.toLowerCase().includes(search.toLowerCase())
    );
    return result;
  }, [userList, activeTab, search]);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const getDeptName = (id?: string) =>
  id ? departments.find((d) => d.id === id)?.name ?? '—' : '—';
  const recalculateImportRows = (rows: StudentImportRow[]) => {
    const emailCount = new Map<string, number>();
    const identifierCount = new Map<string, number>();

    rows.forEach((row) => {
      const email = row.email.trim().toLowerCase();
      const identifier = row.studentId.trim().toLowerCase();

      if (email) {
        emailCount.set(email, (emailCount.get(email) ?? 0) + 1);
      }
      if (identifier) {
        identifierCount.set(identifier, (identifierCount.get(identifier) ?? 0) + 1);
      }
    });

    return rows.map((row) => {
      const issues = new Set<string>();
      const role = row.role === 'LECTURER' ? 'LECTURER' : 'STUDENT';
      const codeLabel = codeLabelByRole(role);
      const normalizedEmail = row.email.trim().toLowerCase();
      const normalizedIdentifier = row.studentId.trim().toLowerCase();

      if (!row.name.trim()) issues.add('Thiếu họ tên');
      if (!row.email.trim()) issues.add('Thiếu email');else
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))
      issues.add('Email không hợp lệ');
      if (!row.studentId.trim()) issues.add(`Sẽ tự sinh ${codeLabel} khi import, nên kiểm tra lại`);
      if (row.departmentId && !departments.some((d) => d.id === row.departmentId)) {
        issues.add('Không tìm thấy khoa');
      }
      if (normalizedEmail && (emailCount.get(normalizedEmail) ?? 0) > 1) {
        issues.add('Email bị trùng trong bản import');
      }
      if (normalizedIdentifier && (identifierCount.get(normalizedIdentifier) ?? 0) > 1) {
        issues.add('Mã tài khoản bị trùng trong bản import');
      }

      const nextIssues = Array.from(issues);
      return {
        ...row,
        role,
        issues: nextIssues,
        ready: !nextIssues.some(isBlockingImportIssue)
      };
    });
  };
  const getNextImportRowNumber = (rows: StudentImportRow[]) =>
  rows.reduce((max, row) => Math.max(max, row.rowNumber), 0) + 1;
  const createEmptyImportRow = (role: ImportableRole, rowNumber: number): StudentImportRow => ({
    rowNumber,
    name: '',
    email: '',
    role,
    studentId: '',
    departmentId: '',
    phone: '',
    operation: 'CREATE',
    ready: false,
    issues: []
  });
  const resetImportState = () => {
    setImportFile(null);
    setImportRows([]);
    setImportRole('STUDENT');
    setDefaultImportPassword('123456');
  };
  const openImport = () => {
    resetImportState();
    setImportModalOpen(true);
  };
  const handlePreviewImport = async () => {
    if (!importFile) {
      showToast('Vui lòng chọn file để import', 'warning');
      return;
    }

    setImportLoading(true);
    try {
      const preview = await previewAdminStudentImportApi(importFile, importRole);
      setImportRows(recalculateImportRows(preview.rows));
      showToast(`Đã đọc ${preview.totalRows} dòng từ file/ảnh import`, 'success');
    } catch (error: any) {
      const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      'Không thể đọc file hoặc ảnh import';
      showToast(message, 'error');
    } finally {
      setImportLoading(false);
    }
  };
  const updateImportRow = (
    index: number,
    field: keyof Pick<StudentImportRow, 'name' | 'email' | 'role' | 'studentId' | 'departmentId' | 'phone' | 'operation'>,
    value: string
  ) => {
    setImportRows((prev) =>
    recalculateImportRows(
      prev.map((row, rowIndex) =>
      rowIndex === index ?
      {
        ...row,
        [field]: value
      } :
      row
      )
    )
    );
  };
  const addImportRow = () => {
    setImportRows((prev) =>
    recalculateImportRows([
    ...prev,
    createEmptyImportRow(importRole, getNextImportRowNumber(prev))]
    )
    );
  };
  const removeImportRow = (index: number) => {
    setImportRows((prev) => recalculateImportRows(prev.filter((_, rowIndex) => rowIndex !== index)));
  };
  const handleApplyImport = async () => {
    if (importRows.length === 0) {
      showToast('Chưa có dữ liệu import để lưu', 'warning');
      return;
    }

    const invalidRows = importRows.filter((row) => !row.ready);
    if (invalidRows.length > 0) {
      showToast('Vui lòng sửa các dòng còn lỗi trước khi import', 'warning');
      return;
    }

    setImportLoading(true);
    try {
      const result = await applyAdminStudentImportApi({
        rows: importRows,
        defaultPassword: defaultImportPassword
      });

      await fetchUsers();
      setImportModalOpen(false);
      resetImportState();
      showToast(
        `Import thành công ${result.totalCount} tài khoản (${result.createdCount} mới, ${result.updatedCount} cập nhật)`,
        'success'
      );
    } catch (error: any) {
      const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      'Import tài khoản thất bại';
      showToast(message, 'error');
    } finally {
      setImportLoading(false);
    }
  };
  const importReadyCount = useMemo(
    () => importRows.filter((row) => row.ready).length,
    [importRows]
  );
  const importCreateCount = useMemo(
    () => importRows.filter((row) => row.operation === 'CREATE').length,
    [importRows]
  );
  const importUpdateCount = useMemo(
    () => importRows.filter((row) => row.operation === 'UPDATE').length,
    [importRows]
  );
  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      email: '',
      role: 'STUDENT',
      departmentId: '',
      studentId: '',
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
      studentId: u.studentId ?? '',
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
    if (form.role === 'STUDENT' && !form.studentId.trim()) {
      errs.studentId = 'Vui lòng nhập mã sinh viên';
    }
    if (!editing && !form.password) errs.password = 'Vui lòng nhập mật khẩu';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      if (editing) {
        await updateAdminUserApi(editing.id, {
          name: form.name,
          email: form.email,
          role: form.role,
          departmentId: form.departmentId || undefined,
          studentId: form.role === 'STUDENT' ? form.studentId.trim() : undefined,
          phone: form.phone || undefined,
          password: form.password || undefined
        });

        showToast('Cập nhật tài khoản thành công!', 'success');
      } else {
        await createAdminUserApi({
          name: form.name,
          email: form.email,
          role: form.role,
          departmentId: form.departmentId || undefined,
          studentId: form.role === 'STUDENT' ? form.studentId.trim() : undefined,
          phone: form.phone || undefined,
          password: form.password
        });

        showToast('Thêm tài khoản thành công!', 'success');
      }

      await fetchUsers();
      setModalOpen(false);
    } catch (error: any) {
      const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      'Lưu tài khoản thất bại';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteModal) return;
    setLoading(true);

    try {
      await deleteAdminUserApi(deleteModal.id);
      await fetchUsers();
      showToast('Đã xóa tài khoản!', 'success');
      setDeleteModal(null);
    } catch {
      showToast('Xóa tài khoản thất bại', 'error');
    } finally {
      setLoading(false);
    }
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
            variant="outline"
            icon={<UploadIcon className="w-4 h-4" />}
            onClick={openImport}>

            Import tài khoản
          </Button>
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

          {form.role === 'STUDENT' &&
          <Input
            label="Mã sinh viên"
            placeholder="VD: SV2024001"
            value={form.studentId}
            onChange={(e) =>
            setForm((p) => ({
              ...p,
              studentId: e.target.value
            }))
            }
            error={formErrors.studentId}
            required />
          }

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
        isOpen={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          resetImportState();
        }}
        title="Import tài khoản"
        size="xl"
        footer={
        <>
            <Button
            variant="outline"
            onClick={() => {
              setImportModalOpen(false);
              resetImportState();
            }}>

              Hủy
            </Button>
            <Button
            variant="outline"
            loading={importLoading}
            onClick={handlePreviewImport}>

              Đọc file hoặc ảnh
            </Button>
            <Button
            variant="primary"
            loading={importLoading}
            disabled={importRows.length === 0 || importReadyCount !== importRows.length}
            onClick={handleApplyImport}>

              Import vào hệ thống
            </Button>
          </>
        }>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Ảnh hoặc file danh sách
              </label>
              <input
                type="file"
                accept=".csv,.xls,.xlsx,.txt,.doc,.docx,.json,.png,.jpg,.jpeg,.webp,.bmp"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-100 dark:hover:file:bg-slate-700" />

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hỗ trợ Excel, CSV, Word, TXT, JSON và ảnh bảng danh sách. Ảnh nên là bảng rõ nét có cột họ tên, email, mã và khoa để AI đọc chính xác hơn.
              </p>
            </div>
            <Select
              label="Vai trò mặc định khi đọc"
              options={importRoleOptions.map((role) => ({
                value: role.value,
                label: role.label
              }))}
              value={importRole}
              onChange={(e) => setImportRole(e.target.value as ImportableRole)}
            />
            <Input
              label="Mật khẩu mặc định cho tài khoản mới"
              type="text"
              value={defaultImportPassword}
              onChange={(e) => setDefaultImportPassword(e.target.value)}
              hint="Chỉ áp dụng cho tài khoản được tạo mới" />
          </div>

          {importRows.length > 0 &&
          <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="info">Tổng: {importRows.length}</Badge>
                  <Badge variant="success">Sẵn sàng: {importReadyCount}</Badge>
                  <Badge variant="neutral">Tạo mới: {importCreateCount}</Badge>
                  <Badge variant="warning">Cập nhật: {importUpdateCount}</Badge>
                </div>
                <Button variant="outline" size="sm" icon={<PlusIcon className="w-4 h-4" />} onClick={addImportRow}>
                  Thêm dòng thủ công
                </Button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                Mỗi dòng có thể đổi vai trò, đổi loại xử lý giữa tạo mới hoặc cập nhật, rồi loại bỏ khỏi danh sách trước khi import.
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full min-w-[1280px] text-sm">
                  <thead className="border-b bg-slate-50 dark:border-slate-800 dark:bg-slate-950/70">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-slate-500 dark:text-slate-400">#</th>
                      <th className="px-3 py-2 text-left text-xs text-slate-500 dark:text-slate-400">Họ tên</th>
                      <th className="px-3 py-2 text-left text-xs text-slate-500 dark:text-slate-400">Email</th>
                      <th className="px-3 py-2 text-left text-xs text-slate-500 dark:text-slate-400">Vai trò</th>
                      <th className="px-3 py-2 text-left text-xs text-slate-500 dark:text-slate-400">Mã</th>
                      <th className="px-3 py-2 text-left text-xs text-slate-500 dark:text-slate-400">Khoa</th>
                      <th className="px-3 py-2 text-left text-xs text-slate-500 dark:text-slate-400">Điện thoại</th>
                      <th className="px-3 py-2 text-left text-xs text-slate-500 dark:text-slate-400">Loại xử lý</th>
                      <th className="px-3 py-2 text-left text-xs text-slate-500 dark:text-slate-400">Trạng thái</th>
                      <th className="px-3 py-2 text-left text-xs text-slate-500 dark:text-slate-400">Bỏ dòng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, index) => {
                      const hasWarnings = row.ready && row.issues.length > 0;

                      return (
                        <tr key={`${row.rowNumber}-${index}`} className="border-b align-top dark:border-slate-800">
                          <td className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500">
                            {row.rowNumber}
                          </td>
                          <td className="px-3 py-3">
                            <input
                              value={row.name}
                              onChange={(e) => updateImportRow(index, 'name', e.target.value)}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              value={row.email}
                              onChange={(e) => updateImportRow(index, 'email', e.target.value)}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                          </td>
                          <td className="px-3 py-3">
                            <select
                              value={row.role}
                              onChange={(e) => updateImportRow(index, 'role', e.target.value)}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">

                              {importRoleOptions.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <input
                              value={row.studentId}
                              placeholder={codePlaceholderByRole(row.role)}
                              onChange={(e) => updateImportRow(index, 'studentId', e.target.value)}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                          </td>
                          <td className="px-3 py-3">
                            <select
                              value={row.departmentId ?? ''}
                              onChange={(e) => updateImportRow(index, 'departmentId', e.target.value)}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">

                              <option value="">Chưa chọn</option>
                              {departments.map((department) => (
                                <option key={department.id} value={department.id}>
                                  {department.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <input
                              value={row.phone ?? ''}
                              onChange={(e) => updateImportRow(index, 'phone', e.target.value)}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                          </td>
                          <td className="px-3 py-3">
                            <select
                              value={row.operation}
                              onChange={(e) => updateImportRow(index, 'operation', e.target.value)}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">

                              {operationOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            {row.ready ? (
                              <div className="space-y-2">
                                <Badge variant={hasWarnings ? 'warning' : 'success'}>
                                  {hasWarnings ? 'Cần kiểm tra' : 'Sẵn sàng'}
                                </Badge>
                                {row.issues.length > 0 && (
                                  <div className="space-y-1">
                                    {row.issues.map((issue) => (
                                      <p
                                        key={issue}
                                        className={`text-xs ${isBlockingImportIssue(issue) ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-300'}`}>

                                        {issue}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Badge variant="error">Cần sửa</Badge>
                                <div className="space-y-1">
                                  {row.issues.map((issue) => (
                                    <p key={issue} className="text-xs text-red-600 dark:text-red-400">
                                      {issue}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                              icon={<TrashIcon className="w-3.5 h-3.5" />}
                              onClick={() => removeImportRow(index)}>

                              Bỏ
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          }
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
