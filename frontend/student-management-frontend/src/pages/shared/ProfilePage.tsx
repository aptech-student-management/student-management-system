import React, { useEffect, useState } from "react";
import {
  UserIcon,
  CameraIcon,
  LockIcon,
  SaveIcon,
  PhoneIcon,
  MailIcon,
  BuildingIcon
} from "lucide-react";

import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";

import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

import {
  uploadAvatarApi,
  updateProfileApi,
  changePasswordApi
} from "../../services/userService";

import { getDepartmentsApi } from "../../services/departmentService";
import { getClassesApi } from "../../services/classService";
import axiosClient from "../../api/axiosClient";

import type { Class, Department, Role } from "../../types";

const roleLabel: Record<Role, string> = {
  ADMIN: "Quản trị viên",
  LECTURER: "Giảng viên",
  STUDENT: "Sinh viên"
};

const roleBadgeVariant: Record<Role, "info" | "success" | "neutral"> = {
  ADMIN: "info",
  LECTURER: "success",
  STUDENT: "neutral"
};

export function ProfilePage() {

  const { currentUser, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [passwordErrors, setPasswordErrors] = useState<Record<string,string>>({});
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name ?? "",
        email: currentUser.email ?? "",
        phone: currentUser.phone ?? ""
      });
    }
  }, [currentUser]);

  useEffect(() => {

    const fetchMeta = async () => {

      try {

        const [deptData, classData] = await Promise.all([
          getDepartmentsApi(),
          getClassesApi()
        ]);

        setDepartments(deptData);
        setClasses(classData);

      } catch {}

    };

    void fetchMeta();

  }, []);

  const dept = departments.find(
    d => String(d.id) === String(currentUser?.departmentId)
  );

  const cls = classes.find(
    c => String(c.id) === String(currentUser?.classId)
  );
  const assetBaseUrl = (axiosClient.defaults.baseURL ?? "").replace(/\/api\/?$/, "");
  const avatarSrc = avatarPreview ?? (
    currentUser?.avatar
      ? (currentUser.avatar.startsWith("http") ? currentUser.avatar : `${assetBaseUrl}${currentUser.avatar}`)
      : null
  );

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxFileSize = 2 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      showToast("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP", "error");
      return;
    }

    if (file.size > maxFileSize) {
      showToast("Ảnh đại diện phải nhỏ hơn 2MB", "error");
      return;
    }

    try {

      const res = await uploadAvatarApi(file);

      const avatarPath =
        typeof res.data === "string" ? res.data : "";

      if (avatarPath) {
        setAvatarPreview(`${assetBaseUrl}${avatarPath}`);
      }

      await refreshProfile();

      showToast("Cập nhật avatar thành công!", "success");

    } catch (error: any) {

      showToast(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Upload avatar thất bại",
        "error"
      );

    }
  };

  const validateProfile = () => {
    const errs: Record<string, string> = {};
    const normalizedName = profileForm.name.trim();
    const normalizedEmail = profileForm.email.trim();
    const normalizedPhone = profileForm.phone.trim();

    if (!normalizedName) {
      errs.name = "Vui lòng nhập họ và tên";
    } else if (normalizedName.length < 3) {
      errs.name = "Họ và tên phải có ít nhất 3 ký tự";
    }

    if (!normalizedEmail) {
      errs.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errs.email = "Email không hợp lệ";
    }

    if (normalizedPhone && !/^(0|\+84)[0-9]{8,9}$/.test(normalizedPhone)) {
      errs.phone = "Số điện thoại không hợp lệ";
    }

    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    try {

      setSaving(true);

      await updateProfileApi({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim() || undefined
      });

      await refreshProfile();

      showToast("Cập nhật thông tin thành công!", "success");

    } catch (error: any) {

      showToast(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Cập nhật thất bại",
        "error"
      );

    } finally {

      setSaving(false);

    }
  };

  const validatePassword = () => {

    const errs: Record<string,string> = {};

    if (!passwordForm.oldPassword)
      errs.oldPassword = "Vui lòng nhập mật khẩu cũ";

    if (!passwordForm.newPassword)
      errs.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (passwordForm.newPassword.length < 6)
      errs.newPassword = "Tối thiểu 6 ký tự";
    else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(passwordForm.newPassword))
      errs.newPassword = "Mật khẩu phải chứa cả chữ và số";

    if (!passwordForm.confirmPassword)
      errs.confirmPassword = "Vui lòng nhập lại mật khẩu mới";
    else if (passwordForm.newPassword !== passwordForm.confirmPassword)
      errs.confirmPassword = "Mật khẩu xác nhận không khớp";

    setPasswordErrors(errs);

    return Object.keys(errs).length === 0;
  };

  const handleChangePassword = async () => {

    if (!validatePassword()) return;

    try {

      setChangingPassword(true);

      await changePasswordApi({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });

      showToast("Đổi mật khẩu thành công!", "success");

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

    } catch (error: any) {

      showToast(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Đổi mật khẩu thất bại",
        "error"
      );

    } finally {

      setChangingPassword(false);

    }
  };

  if (!currentUser) return null;

  return (

    <Layout title="Hồ sơ cá nhân">

      <div className="max-w-3xl mx-auto space-y-6">

        {/* PROFILE HEADER */}

        <Card>

          <div className="flex items-center gap-6">

            <div className="relative">

              <div className="
                w-24 h-24 rounded-2xl
                bg-blue-100 flex items-center
                justify-center text-3xl
                font-bold text-blue-700
                overflow-hidden
              ">

                {avatarSrc ? (

                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />

                ) : (

                  currentUser.name.charAt(0)

                )}

              </div>

              <label className="
                absolute -bottom-1 -right-1
                w-8 h-8 rounded-full
                bg-white border
                flex items-center justify-center
                cursor-pointer shadow
              ">

                <CameraIcon className="w-4 h-4 text-slate-500"/>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />

              </label>

            </div>

            <div className="flex-1">

              <div className="flex items-center gap-3 mb-1">

                <h2 className="text-xl font-bold">
                  {currentUser.name}
                </h2>

                <Badge variant={roleBadgeVariant[currentUser.role]} dot>
                  {roleLabel[currentUser.role]}
                </Badge>

              </div>

              <p className="text-sm text-slate-500">
                {currentUser.email}
              </p>

              <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                {currentUser.studentId && (
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3"/>
                    {currentUser.studentId}
                  </span>
                )}

                {dept && (
                  <span className="flex items-center gap-1">
                    <BuildingIcon className="w-3 h-3"/>
                    {dept.name}
                  </span>
                )}

                {cls && (
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3"/>
                    {cls.name}
                  </span>
                )}

              </div>

            </div>

          </div>

        </Card>

        {/* PROFILE FORM */}

        <Card title="Thông tin cá nhân">

          <div className="space-y-4">

            <Input
              label="Họ và tên"
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm(p => ({ ...p, name: e.target.value }))
              }
              onBlur={() => setProfileErrors((prev) => {
                const next = { ...prev };
                delete next.name;
                return next;
              })}
              error={profileErrors.name}
              icon={<UserIcon className="w-4 h-4"/>}
            />

            <Input
              label="Email"
              value={profileForm.email}
              onChange={(e) =>
                setProfileForm(p => ({ ...p, email: e.target.value }))
              }
              onBlur={() => setProfileErrors((prev) => {
                const next = { ...prev };
                delete next.email;
                return next;
              })}
              error={profileErrors.email}
              icon={<MailIcon className="w-4 h-4"/>}
            />

            <Input
              label="Số điện thoại"
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm(p => ({ ...p, phone: e.target.value }))
              }
              onBlur={() => setProfileErrors((prev) => {
                const next = { ...prev };
                delete next.phone;
                return next;
              })}
              error={profileErrors.phone}
              icon={<PhoneIcon className="w-4 h-4"/>}
            />

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Mã người dùng</p>
                <p className="text-sm font-medium text-slate-900">{currentUser.id}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Mã sinh viên</p>
                <p className="text-sm font-medium text-slate-900">{currentUser.studentId || "—"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Lớp</p>
                <p className="text-sm font-medium text-slate-900">{cls?.name || "—"}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">

              <Button
                icon={<SaveIcon className="w-4 h-4"/>}
                loading={saving}
                onClick={handleSaveProfile}
              >
                Lưu thay đổi
              </Button>

            </div>

          </div>

        </Card>

        {/* PASSWORD */}

        <Card title="Đổi mật khẩu">

          <div className="space-y-4">

            <Input
              label="Mật khẩu hiện tại"
              type="password"
              value={passwordForm.oldPassword}
              error={passwordErrors.oldPassword}
              onChange={(e) =>
                setPasswordForm(p => ({ ...p, oldPassword: e.target.value }))
              }
            />

            <Input
              label="Mật khẩu mới"
              type="password"
              value={passwordForm.newPassword}
              error={passwordErrors.newPassword}
              onChange={(e) =>
                setPasswordForm(p => ({ ...p, newPassword: e.target.value }))
              }
            />

            <Input
              label="Xác nhận mật khẩu"
              type="password"
              value={passwordForm.confirmPassword}
              error={passwordErrors.confirmPassword}
              onChange={(e) =>
                setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))
              }
            />

            <div className="flex justify-end">

              <Button
                icon={<LockIcon className="w-4 h-4"/>}
                loading={changingPassword}
                onClick={handleChangePassword}
              >
                Đổi mật khẩu
              </Button>

            </div>

          </div>

        </Card>

      </div>

    </Layout>
  );
}
