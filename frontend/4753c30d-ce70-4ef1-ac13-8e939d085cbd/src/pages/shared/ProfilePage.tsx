import React, { useState } from 'react';
import {
  UserIcon,
  CameraIcon,
  LockIcon,
  SaveIcon,
  PhoneIcon,
  MailIcon,
  BuildingIcon } from
'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { departments, classes } from '../../data/mockData';
import type { Role } from '../../types';
const roleLabel: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  LECTURER: 'Giảng viên',
  STUDENT: 'Sinh viên'
};
const roleBadgeVariant: Record<Role, 'info' | 'success' | 'neutral'> = {
  ADMIN: 'info',
  LECTURER: 'success',
  STUDENT: 'neutral'
};
export function ProfilePage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name ?? '',
    email: currentUser?.email ?? '',
    phone: currentUser?.phone ?? ''
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );
  const dept = departments.find((d) => d.id === currentUser?.departmentId);
  const cls = classes.find((c) => c.id === currentUser?.classId);
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      showToast('Ảnh đại diện đã được cập nhật (demo)', 'success');
    }
  };
  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    showToast('Cập nhật thông tin thành công!', 'success');
    setSaving(false);
  };
  const validatePassword = () => {
    const errs: Record<string, string> = {};
    if (!passwordForm.oldPassword)
    errs.oldPassword = 'Vui lòng nhập mật khẩu cũ';
    if (!passwordForm.newPassword)
    errs.newPassword = 'Vui lòng nhập mật khẩu mới';else
    if (passwordForm.newPassword.length < 6)
    errs.newPassword = 'Mật khẩu tối thiểu 6 ký tự';
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
    errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    setChangingPassword(true);
    await new Promise((r) => setTimeout(r, 700));
    showToast('Đổi mật khẩu thành công!', 'success');
    setPasswordForm({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setChangingPassword(false);
  };
  if (!currentUser) return null;
  return (
    <Layout title="Hồ sơ cá nhân">
      <div className="max-w-2xl space-y-6">
        {/* Avatar + basic info */}
        <Card>
          <div className="flex items-start gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-700 overflow-hidden">
                {avatarPreview ?
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover" /> :


                currentUser.name.charAt(0)
                }
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                <CameraIcon className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange} />

              </label>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {currentUser.name}
                </h2>
                <Badge variant={roleBadgeVariant[currentUser.role]} dot>
                  {roleLabel[currentUser.role]}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{currentUser.email}</p>
              {currentUser.studentId &&
              <p className="text-xs text-slate-400 mt-1 font-mono">
                  MSSV: {currentUser.studentId}
                </p>
              }
              {currentUser.lecturerId &&
              <p className="text-xs text-slate-400 mt-1 font-mono">
                  Mã GV: {currentUser.lecturerId}
                </p>
              }
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                {dept &&
                <span className="flex items-center gap-1">
                    <BuildingIcon className="w-3 h-3" />
                    {dept.name}
                  </span>
                }
                {cls &&
                <span className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    {cls.name}
                  </span>
                }
              </div>
            </div>
          </div>
        </Card>

        {/* Personal info form */}
        <Card title="Thông tin cá nhân" icon={<UserIcon className="w-4 h-4" />}>
          <div className="space-y-4">
            <Input
              label="Họ và tên"
              value={profileForm.name}
              onChange={(e) =>
              setProfileForm((p) => ({
                ...p,
                name: e.target.value
              }))
              }
              icon={<UserIcon className="w-4 h-4" />} />

            <Input
              label="Email"
              type="email"
              value={profileForm.email}
              onChange={(e) =>
              setProfileForm((p) => ({
                ...p,
                email: e.target.value
              }))
              }
              icon={<MailIcon className="w-4 h-4" />} />

            <Input
              label="Số điện thoại"
              value={profileForm.phone}
              onChange={(e) =>
              setProfileForm((p) => ({
                ...p,
                phone: e.target.value
              }))
              }
              icon={<PhoneIcon className="w-4 h-4" />} />

            {dept &&
            <Input
              label="Khoa"
              value={dept.name}
              disabled
              hint="Thông tin này chỉ có thể thay đổi bởi Admin" />

            }
            {cls &&
            <Input
              label="Lớp"
              value={cls.name}
              disabled
              hint="Thông tin này chỉ có thể thay đổi bởi Admin" />

            }
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                icon={<SaveIcon className="w-4 h-4" />}
                loading={saving}
                onClick={handleSaveProfile}>

                Lưu thay đổi
              </Button>
            </div>
          </div>
        </Card>

        {/* Change password */}
        <Card title="Đổi mật khẩu" icon={<LockIcon className="w-4 h-4" />}>
          <div className="space-y-4">
            <Input
              label="Mật khẩu hiện tại"
              type="password"
              value={passwordForm.oldPassword}
              onChange={(e) =>
              setPasswordForm((p) => ({
                ...p,
                oldPassword: e.target.value
              }))
              }
              error={passwordErrors.oldPassword}
              required />

            <Input
              label="Mật khẩu mới"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
              setPasswordForm((p) => ({
                ...p,
                newPassword: e.target.value
              }))
              }
              error={passwordErrors.newPassword}
              hint="Tối thiểu 6 ký tự"
              required />

            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
              setPasswordForm((p) => ({
                ...p,
                confirmPassword: e.target.value
              }))
              }
              error={passwordErrors.confirmPassword}
              required />

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                icon={<LockIcon className="w-4 h-4" />}
                loading={changingPassword}
                onClick={handleChangePassword}>

                Đổi mật khẩu
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>);

}