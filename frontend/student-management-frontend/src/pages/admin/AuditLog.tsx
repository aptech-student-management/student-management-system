import React, { useMemo, useState } from 'react';
import { SearchIcon, DownloadIcon, ShieldIcon } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { auditLogs } from '../../data/mockData';
import type { AuditLog as AuditLogType } from '../../types';
const PAGE_SIZE = 10;
const actionConfig: Record<
  string,
  {
    variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    label: string;
  }> =
{
  CREATE: {
    variant: 'success',
    label: 'Tạo mới'
  },
  UPDATE: {
    variant: 'warning',
    label: 'Cập nhật'
  },
  DELETE: {
    variant: 'error',
    label: 'Xóa'
  },
  LOGIN: {
    variant: 'info',
    label: 'Đăng nhập'
  },
  LOGOUT: {
    variant: 'neutral',
    label: 'Đăng xuất'
  },
  EXPORT: {
    variant: 'neutral',
    label: 'Xuất file'
  }
};
export function AuditLog() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    let result = [...auditLogs].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
    );
    if (search)
    result = result.filter(
      (l) =>
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.detail.toLowerCase().includes(search.toLowerCase())
    );
    if (filterAction) result = result.filter((l) => l.action === filterAction);
    if (filterDate)
    result = result.filter((l) => l.timestamp.startsWith(filterDate));
    return result;
  }, [search, filterAction, filterDate]);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const handleExport = () => {
    showToast('Đang xuất file Excel... (Tính năng demo)', 'info');
  };
  const columns = [
  {
    key: 'timestamp',
    label: 'Thời gian',
    render: (_: unknown, row: AuditLogType) =>
    <div>
          <p className="text-xs font-medium text-slate-700">
            {row.timestamp.split(' ')[0]}
          </p>
          <p className="text-xs text-slate-400">
            {row.timestamp.split(' ')[1]}
          </p>
        </div>

  },
  {
    key: 'userName',
    label: 'Người dùng',
    render: (_: unknown, row: AuditLogType) =>
    <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
            {row.userName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-slate-800">
            {row.userName}
          </span>
        </div>

  },
  {
    key: 'action',
    label: 'Hành động',
    render: (_: unknown, row: AuditLogType) => {
      const cfg = actionConfig[row.action] ?? {
        variant: 'neutral' as const,
        label: row.action
      };
      return (
        <Badge variant={cfg.variant} dot>
            {cfg.label}
          </Badge>);

    }
  },
  {
    key: 'target',
    label: 'Đối tượng',
    render: (_: unknown, row: AuditLogType) =>
    <span className="text-sm text-slate-600 font-medium">{row.target}</span>

  },
  {
    key: 'detail',
    label: 'Chi tiết',
    render: (_: unknown, row: AuditLogType) =>
    <span
      className="text-xs text-slate-600 max-w-xs block truncate"
      title={row.detail}>

          {row.detail}
        </span>

  }];

  return (
    <Layout title="Audit Log - Lịch sử hoạt động">
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(actionConfig).
          slice(0, 4).
          map(([action, cfg]) => {
            const count = auditLogs.filter((l) => l.action === action).length;
            return (
              <div
                key={action}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">

                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  <span className="text-xl font-bold text-slate-900">
                    {count}
                  </span>
                </div>);

          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <Input
              placeholder="Tìm theo người dùng, chi tiết..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              icon={<SearchIcon className="w-4 h-4" />} />

          </div>
          <div className="w-40">
            <Select
              options={Object.entries(actionConfig).map(([k, v]) => ({
                value: k,
                label: v.label
              }))}
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(1);
              }}
              placeholder="Tất cả hành động" />

          </div>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setPage(1);
            }}
            className="w-40" />

          <Button
            variant="outline"
            icon={<DownloadIcon className="w-4 h-4" />}
            onClick={handleExport}>

            Xuất Excel
          </Button>
        </div>

        <Card
          padding={false}
          title="Nhật ký hoạt động"
          icon={<ShieldIcon className="w-4 h-4" />}
          subtitle={`${filtered.length} bản ghi`}>

          <Table
            columns={columns as Parameters<typeof Table>[0]['columns']}
            data={paginated as Record<string, unknown>[]}
            emptyMessage="Không tìm thấy bản ghi nào"
            keyExtractor={(row) => (row as AuditLogType).id} />

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
    </Layout>);

}