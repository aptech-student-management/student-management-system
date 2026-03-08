import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCapIcon,
  EyeIcon,
  EyeOffIcon,
  UserIcon,
  LockIcon } from
'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const validate = () => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};
    if (!email) newErrors.email = 'Vui lòng nhập tài khoản';
    if (!password) newErrors.password = 'Vui lòng nhập mật khẩu';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await login(email, password);
    if (result.success) {
      showToast('Đăng nhập thành công!', 'success');
      const stored = localStorage.getItem('uni_auth_user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user.role === 'ADMIN') navigate('/admin');else
        if (user.role === 'LECTURER') navigate('/lecturer');else
        navigate('/student');
      }
    } else {
      showToast(result.error ?? 'Đăng nhập thất bại', 'error');
      setErrors({
        password: result.error
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/3 rounded-full" />
        </div>

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

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Nền tảng quản lý
              <br />
              <span className="text-blue-300">đào tạo đại học</span>
              <br />
              hiện đại
            </h2>
            <p className="text-white/70 text-base leading-relaxed max-w-sm">
              Hệ thống tích hợp toàn diện cho Quản trị viên, Giảng viên và Sinh
              viên — quản lý học tập thông minh, hiệu quả.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
          {
            label: 'Sinh viên',
            value: '1,180+',
            color: 'bg-white/10'
          },
          {
            label: 'Giảng viên',
            value: '85+',
            color: 'bg-white/10'
          },
          {
            label: 'Môn học',
            value: '150+',
            color: 'bg-white/10'
          }].
          map((stat) =>
          <div
            key={stat.label}
            className={`${stat.color} rounded-xl p-4 backdrop-blur-sm`}>

              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-white/60 text-xs mt-1">{stat.label}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
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
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Đăng nhập</h1>
              <p className="text-slate-500 text-sm mt-1">
                Vui lòng đăng nhập bằng tài khoản được cấp bởi quản trị viên.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Tài khoản"
                type="text"
                placeholder="Nhập tài khoản"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    email: undefined
                  }));
                }}
                error={errors.email}
                icon={<UserIcon className="w-4 h-4" />}
                required
                autoComplete="username" />


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
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({
                        ...prev,
                        password: undefined
                      }));
                    }}
                    autoComplete="current-password"
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
              </div>

              <Button
                type="submit"
                fullWidth
                loading={isLoading}
                size="lg"
                className="mt-2">

                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>


          </div>
        </div>
      </div>
    </div>);

}