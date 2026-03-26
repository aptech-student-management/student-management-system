import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCapIcon,
  EyeIcon,
  EyeOffIcon,
  UserIcon,
  LockIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ThemeToggle } from '../components/ui/ThemeToggle';

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await login(email, password);

    if (result.success) {
      showToast('Đăng nhập thành công!', 'success');
      const stored = localStorage.getItem('uni_user');

      if (stored) {
        const user = JSON.parse(stored);
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'LECTURER') navigate('/lecturer');
        else navigate('/student');
      } else {
        navigate('/');
      }
    } else {
      showToast(result.error ?? 'Đăng nhập thất bại', 'error');
      setErrors({
        password: result.error
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] lg:grid lg:grid-cols-[1.02fr_0.98fr]">
      <div className="ui-sidebar-shell relative hidden overflow-hidden px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 ui-layout-accent-glow opacity-90" />
        <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.04),transparent_36%)]" />
        <div className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-24 -left-12 h-80 w-80 rounded-full bg-white/[0.03]" />

        <div className="relative z-10">
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/14">
              <GraduationCapIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight text-white">
                UniEdu
              </p>
              <p className="text-xs text-white/60">Hệ thống Quản lý Đào tạo</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight text-white">
              Giao diện gọn gàng,
              <br />
              dễ theo dõi,
              <br />
              học tập hiệu quả hơn
            </h2>
            <p className="max-w-md text-base leading-relaxed text-white/72">
              Nền tảng quản lý đào tạo cho Quản trị viên, Giảng viên và Sinh viên
              với bố cục rõ ràng, thao tác nhanh và dark mode dễ dùng trong thời
              gian dài.
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
            }
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.color} rounded-2xl border border-white/10 p-4 backdrop-blur-sm`}
            >
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-xs text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex items-center justify-center p-6 lg:p-10">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="ui-panel-surface flex h-10 w-10 items-center justify-center rounded-xl">
              <GraduationCapIcon className="ui-text-strong h-6 w-6" />
            </div>
            <div>
              <p className="ui-text-strong text-lg font-bold">UniEdu</p>
              <p className="ui-text-muted text-xs">Hệ thống Quản lý Đào tạo</p>
            </div>
          </div>

          <div className="ui-panel-surface ui-panel-surface-strong relative overflow-hidden rounded-[30px] p-8 shadow-card">
            <div className="pointer-events-none absolute inset-0 ui-hero-accent-glow-login" />

            <div className="relative mb-8">
              <h1 className="ui-text-strong text-2xl font-bold">Đăng nhập</h1>
              <p className="ui-text-muted mt-1 text-sm">
                Vui lòng đăng nhập bằng tài khoản được cấp bởi quản trị viên.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="relative space-y-4">
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
                icon={<UserIcon className="h-4 w-4" />}
                required
                autoComplete="username"
              />

              <div className="flex flex-col gap-1">
                <label className="ui-form-label text-sm font-medium">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="ui-text-muted absolute left-3 top-1/2 -translate-y-1/2">
                    <LockIcon className="h-4 w-4" />
                  </div>
                  <Input
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
                    className={`pl-10 pr-10 ${errors.password ? 'ui-form-field-error' : ''}`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="ui-text-muted absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                fullWidth
                loading={isLoading}
                size="lg"
                className="mt-2"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
