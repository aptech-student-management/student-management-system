import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCapIcon,
  EyeIcon,
  EyeOffIcon,
  UserIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  IdCardIcon,
  ChevronRightIcon,
  CheckIcon } from
'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { departments } from '../data/mockData';
import type { Role } from '../types';
interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role | '';
  departmentId: string;
  phone: string;
  studentId: string;
}
interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  departmentId?: string;
  phone?: string;
  studentId?: string;
}
const STEPS = [
{
  id: 1,
  label: 'Thông tin cơ bản'
},
{
  id: 2,
  label: 'Thông tin học vụ'
},
{
  id: 3,
  label: 'Bảo mật'
}];

export function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    departmentId: '',
    phone: '',
    studentId: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const update = (field: keyof RegisterForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
    setErrors((prev) => ({
      ...prev,
      [field]: undefined
    }));
  };
  const validateStep1 = (): boolean => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập họ và tên';else
    if (form.name.trim().length < 3)
    errs.name = 'Họ tên phải có ít nhất 3 ký tự';
    if (!form.email.trim()) errs.email = 'Vui lòng nhập email';else
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errs.email = 'Email không hợp lệ';
    if (form.phone && !/^(0|\+84)[0-9]{8,9}$/.test(form.phone))
    errs.phone = 'Số điện thoại không hợp lệ';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const validateStep2 = (): boolean => {
    const errs: FormErrors = {};
    if (!form.role) errs.role = 'Vui lòng chọn vai trò';
    if (!form.departmentId) errs.departmentId = 'Vui lòng chọn khoa';
    if (form.role === 'STUDENT' && !form.studentId.trim())
    errs.studentId = 'Vui lòng nhập mã sinh viên';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const validateStep3 = (): boolean => {
    const errs: FormErrors = {};
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu';else
    if (form.password.length < 6)
    errs.password = 'Mật khẩu phải có ít nhất 6 ký tự';else
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(form.password))
    errs.password = 'Mật khẩu phải chứa cả chữ và số';
    if (!form.confirmPassword)
    errs.confirmPassword = 'Vui lòng xác nhận mật khẩu';else
    if (form.password !== form.confirmPassword)
    errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);else
    if (step === 2 && validateStep2()) setStep(3);
  };
  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    showToast('Đăng ký tài khoản thành công! Vui lòng đăng nhập.', 'success');
    setLoading(false);
    navigate('/login');
  };
  const roleOptions = [
  {
    value: 'STUDENT',
    label: '👨‍🎓 Sinh viên'
  },
  {
    value: 'LECTURER',
    label: '👨‍🏫 Giảng viên'
  }];

  const deptOptions = departments.map((d) => ({
    value: d.id,
    label: d.name
  }));
  const passwordStrength = (() => {
    const p = form.password;
    if (!p)
    return {
      level: 0,
      label: '',
      color: ''
    };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    if (score <= 1)
    return {
      level: 1,
      label: 'Yếu',
      color: 'bg-red-500'
    };
    if (score <= 2)
    return {
      level: 2,
      label: 'Trung bình',
      color: 'bg-amber-500'
    };
    if (score <= 3)
    return {
      level: 3,
      label: 'Khá',
      color: 'bg-blue-500'
    };
    return {
      level: 4,
      label: 'Mạnh',
      color: 'bg-emerald-500'
    };
  })();
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-white/3 rounded-full" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCapIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">
                UniEdu
              </p>
              <p className="text-white/60 text-xs">Hệ thống Quản lý Đào tạo</p>
            </div>
          </div>

          <div className="space-y-5">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Tham gia cùng
              <br />
              <span className="text-blue-300">cộng đồng</span>
              <br />
              học thuật
            </h2>
            <p className="text-white/70 text-base leading-relaxed max-w-sm">
              Tạo tài khoản để truy cập đầy đủ các tính năng quản lý học tập,
              điểm số và thời khóa biểu.
            </p>
          </div>

          {/* Step guide */}
          <div className="mt-10 space-y-3">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">
              Quy trình đăng ký
            </p>
            {STEPS.map((s, idx) =>
            <div key={s.id} className="flex items-center gap-3">
                <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${step > s.id ? 'bg-emerald-500 text-white' : step === s.id ? 'bg-white text-blue-900' : 'bg-white/20 text-white/50'}`}>

                  {step > s.id ? <CheckIcon className="w-3.5 h-3.5" /> : s.id}
                </div>
                <span
                className={`text-sm transition-all ${step >= s.id ? 'text-white font-medium' : 'text-white/40'}`}>

                  {s.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold text-white">1,180+</p>
            <p className="text-white/60 text-xs mt-1">Sinh viên</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold text-white">85+</p>
            <p className="text-white/60 text-xs mt-1">Giảng viên</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold text-white">150+</p>
            <p className="text-white/60 text-xs mt-1">Môn học</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md py-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center">
              <GraduationCapIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">UniEdu</p>
              <p className="text-slate-500 text-xs">Hệ thống Quản lý Đào tạo</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Tạo tài khoản
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Đã có tài khoản?{' '}
                <Link
                  to="/login"
                  className="text-blue-700 font-medium hover:text-blue-800 transition-colors">

                  Đăng nhập ngay
                </Link>
              </p>
            </div>

            {/* Step indicator (mobile) */}
            <div className="flex items-center gap-2 mb-6">
              {STEPS.map((s, idx) =>
              <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${step > s.id ? 'bg-emerald-500 text-white' : step === s.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-400'}`}>

                    {step > s.id ? <CheckIcon className="w-3.5 h-3.5" /> : s.id}
                  </div>
                  <span
                  className={`text-xs font-medium hidden sm:block ${step >= s.id ? 'text-slate-700' : 'text-slate-400'}`}>

                    {s.label}
                  </span>
                  {idx < STEPS.length - 1 &&
                <div
                  className={`flex-1 h-0.5 rounded-full transition-all ${step > s.id ? 'bg-emerald-400' : 'bg-slate-200'}`} />

                }
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic info */}
              {step === 1 &&
              <div className="space-y-4 animate-fade-in">
                  <Input
                  label="Họ và tên"
                  placeholder="Nguyễn Văn A"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  error={errors.name}
                  icon={<UserIcon className="w-4 h-4" />}
                  required
                  autoFocus />

                  <Input
                  label="Email"
                  type="email"
                  placeholder="example@uni.edu.vn"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  error={errors.email}
                  icon={<MailIcon className="w-4 h-4" />}
                  required />

                  <Input
                  label="Số điện thoại"
                  type="tel"
                  placeholder="09xxxxxxxx"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  error={errors.phone}
                  icon={<PhoneIcon className="w-4 h-4" />}
                  hint="Không bắt buộc" />

                </div>
              }

              {/* Step 2: Academic info */}
              {step === 2 &&
              <div className="space-y-4 animate-fade-in">
                  <Select
                  label="Vai trò"
                  options={roleOptions}
                  value={form.role}
                  onChange={(e) => update('role', e.target.value)}
                  error={errors.role}
                  placeholder="Chọn vai trò của bạn"
                  required />

                  <Select
                  label="Khoa"
                  options={deptOptions}
                  value={form.departmentId}
                  onChange={(e) => update('departmentId', e.target.value)}
                  error={errors.departmentId}
                  placeholder="Chọn khoa"
                  required />

                  {form.role === 'STUDENT' &&
                <Input
                  label="Mã sinh viên"
                  placeholder="VD: SV2022001"
                  value={form.studentId}
                  onChange={(e) => update('studentId', e.target.value)}
                  error={errors.studentId}
                  icon={<IdCardIcon className="w-4 h-4" />}
                  required />

                }
                  {form.role === 'LECTURER' &&
                <Input
                  label="Mã giảng viên"
                  placeholder="VD: GV001"
                  value={form.studentId}
                  onChange={(e) => update('studentId', e.target.value)}
                  icon={<IdCardIcon className="w-4 h-4" />}
                  hint="Không bắt buộc" />

                }
                  {!form.role &&
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
                      💡 Chọn vai trò để xem các trường thông tin phù hợp
                    </div>
                }
                </div>
              }

              {/* Step 3: Security */}
              {step === 3 &&
              <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <LockIcon className="w-4 h-4" />
                      </div>
                      <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Tối thiểu 6 ký tự"
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      autoComplete="new-password"
                      className={`w-full pl-10 pr-10 py-2 text-sm rounded-lg border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? 'border-red-400' : 'border-slate-300 hover:border-slate-400'}`} />

                      <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">

                        {showPassword ?
                      <EyeOffIcon className="w-4 h-4" /> :

                      <EyeIcon className="w-4 h-4" />
                      }
                      </button>
                    </div>
                    {errors.password &&
                  <p className="text-xs text-red-600">{errors.password}</p>
                  }

                    {/* Password strength */}
                    {form.password &&
                  <div className="mt-1.5 space-y-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) =>
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${passwordStrength.level >= level ? passwordStrength.color : 'bg-slate-200'}`} />

                      )}
                        </div>
                        <p
                      className={`text-xs font-medium ${passwordStrength.level === 1 ? 'text-red-500' : passwordStrength.level === 2 ? 'text-amber-500' : passwordStrength.level === 3 ? 'text-blue-500' : 'text-emerald-500'}`}>

                          Độ mạnh: {passwordStrength.label}
                        </p>
                      </div>
                  }
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <LockIcon className="w-4 h-4" />
                      </div>
                      <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu"
                      value={form.confirmPassword}
                      onChange={(e) =>
                      update('confirmPassword', e.target.value)
                      }
                      autoComplete="new-password"
                      className={`w-full pl-10 pr-10 py-2 text-sm rounded-lg border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.confirmPassword ? 'border-red-400' : form.confirmPassword && form.password === form.confirmPassword ? 'border-emerald-400' : 'border-slate-300 hover:border-slate-400'}`} />

                      <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">

                        {showConfirm ?
                      <EyeOffIcon className="w-4 h-4" /> :

                      <EyeIcon className="w-4 h-4" />
                      }
                      </button>
                    </div>
                    {errors.confirmPassword &&
                  <p className="text-xs text-red-600">
                        {errors.confirmPassword}
                      </p>
                  }
                    {form.confirmPassword &&
                  form.password === form.confirmPassword &&
                  !errors.confirmPassword &&
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckIcon className="w-3 h-3" /> Mật khẩu khớp
                        </p>
                  }
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Xác nhận thông tin
                    </p>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Họ tên:</span>
                        <span className="font-medium text-slate-800">
                          {form.name || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="font-medium text-slate-800 truncate ml-4">
                          {form.email || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vai trò:</span>
                        <span className="font-medium text-slate-800">
                          {form.role === 'STUDENT' ?
                        'Sinh viên' :
                        form.role === 'LECTURER' ?
                        'Giảng viên' :
                        '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Khoa:</span>
                        <span className="font-medium text-slate-800 truncate ml-4">
                          {departments.find((d) => d.id === form.departmentId)?.
                        name || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              }

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-6">
                {step > 1 &&
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1">

                    Quay lại
                  </Button>
                }
                {step < 3 ?
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  fullWidth={step === 1}
                  className={step > 1 ? 'flex-1' : ''}
                  icon={<ChevronRightIcon className="w-4 h-4" />}>

                    Tiếp theo
                  </Button> :

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="flex-1"
                  icon={
                  !loading ? <CheckIcon className="w-4 h-4" /> : undefined
                  }>

                    {loading ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}
                  </Button>
                }
              </div>
            </form>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-slate-400 mt-4">
            Bằng cách đăng ký, bạn đồng ý với{' '}
            <span className="text-blue-600 cursor-pointer hover:underline">
              Điều khoản sử dụng
            </span>{' '}
            và{' '}
            <span className="text-blue-600 cursor-pointer hover:underline">
              Chính sách bảo mật
            </span>
          </p>
        </div>
      </div>
    </div>);

}