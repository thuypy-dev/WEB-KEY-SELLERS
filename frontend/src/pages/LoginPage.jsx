import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldAlert,
  Sparkles,
  Check,
  KeyRound,
  X,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import useLanguageStore from '../store/useLanguageStore';
import axiosClient from '../store/axiosClient';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [shake, setShake] = useState(false);

  // --- STATE MODAL QUÊN MẬT KHẨU ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Nhập email, 2: Nhập OTP & Mật khẩu mới
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotShowPass, setForgotShowPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Đếm ngược 60s cho việc gửi lại OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOpenForgot = (e) => {
    e.preventDefault();
    setForgotEmail(formData.email || '');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotError('');
    setForgotSuccess('');
    setForgotStep(1);
    setShowForgotModal(true);
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Vui lòng nhập địa chỉ email của bạn!');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      const res = await axiosClient.post('/auth/forgot-password', {
        email: forgotEmail.trim(),
      });
      setForgotSuccess(res?.message || 'Mã xác thực OTP đã được gửi đến email của bạn!');
      setForgotStep(2);
      setCountdown(60);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại!');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim() || !forgotNewPassword) {
      setForgotError('Vui lòng nhập đầy đủ mã OTP và mật khẩu mới!');
      return;
    }
    if (forgotOtp.trim().length !== 6) {
      setForgotError('Mã OTP phải gồm đúng 6 chữ số!');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      const res = await axiosClient.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword,
      });
      setForgotSuccess(res?.message || 'Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        setShowForgotModal(false);
        setIsLogin(true);
        setFormData((prev) => ({ ...prev, email: forgotEmail, password: '' }));
      }, 1500);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Xác thực OTP thất bại. Vui lòng thử lại!');
    } finally {
      setForgotLoading(false);
    }
  };

  const navigate = useNavigate();
  const loginSuccess = useAuthStore((state) => state.loginSuccess);
  const { t } = useLanguageStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleFocus = () => {
    if (error) setError('');
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // --- XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Vui lòng nhập đầy đủ thông tin!');
      triggerShake();
      return;
    }

    if (!isLogin && !formData.fullName?.trim()) {
      setError('Vui lòng nhập họ và tên của bạn!');
      triggerShake();
      return;
    }

    setLoading(true);

    const endpoint = isLogin ? 'login' : 'signup';
    const payload = isLogin
      ? { email: formData.email.trim(), password: formData.password }
      : {
          email: formData.email.trim(),
          password: formData.password,
          fullName: formData.fullName.trim(),
        };

    try {
      const data = await axiosClient.post(`/auth/${endpoint}`, payload);

      if (isLogin) {
        loginSuccess(data.user, data.accessToken);
        if (String(data.user?.role).toUpperCase() === 'ADMIN') {
          navigate('/admin'); // Admin thì vào Dashboard
        } else {
          navigate('/');      // Khách thì ra Trang chủ
        }
      } else {
        alert('🎉 Đăng ký thành công! Vui lòng đăng nhập với tài khoản vừa tạo.');
        setIsLogin(true);
        setFormData({ ...formData, password: '' });
      }
    } catch (err) {
      console.error('Login Error:', err);

      let message = 'Có lỗi xảy ra, vui lòng thử lại.';
      if (err.response) {
        const status = err.response.status;
        if (status === 429) {
          message = 'Thao tác quá nhanh! Vui lòng đợi trong giây lát 🙏';
        } else if (status === 401) {
          message = 'Email hoặc mật khẩu không chính xác!';
        } else if (status === 409) {
          message = 'Email này đã được sử dụng bởi tài khoản khác!';
        } else if (err.response.data?.message) {
          message = Array.isArray(err.response.data.message)
            ? err.response.data.message[0]
            : err.response.data.message;
        }
      } else if (err.request) {
        message = 'Không thể kết nối Server. Vui lòng kiểm tra mạng.';
      }

      setError(message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden dark:bg-[#070b14] bg-slate-50 transition-colors duration-300">
      {/* --- AMBIENT NEON GLOW EFFECTS (Platform v2.0) --- */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 dark:bg-blue-500/15 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/20 dark:bg-indigo-500/15 rounded-full blur-[150px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-cyan-500/15 dark:bg-cyan-400/10 rounded-full blur-[130px]"></div>
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="w-full max-w-[440px] z-10">
        {/* --- BRAND HEADER --- */}
        <div className="text-center mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 group mb-2 focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-neon-blue shadow-lg group-hover:scale-105 transition-transform">
              <Sparkles size={20} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
              PDT<span className="text-blue-600 dark:text-blue-400">KEY</span>
            </span>
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Nền tảng bản quyền số & phần mềm chính hãng
          </p>
        </div>

        {/* --- TAB SWITCHER (Glassmorphism Pill) --- */}
        <div className="relative flex p-1.5 rounded-2xl dark:bg-slate-900/90 bg-slate-200/80 border border-slate-300/80 dark:border-white/10 backdrop-blur-md mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`relative flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 z-10 ${
              isLogin
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isLogin && (
              <motion.div
                layoutId="auth-tab-pill"
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-neon-blue shadow-md"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {t('login')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`relative flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 z-10 ${
              !isLogin
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {!isLogin && (
              <motion.div
                layoutId="auth-tab-pill"
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-neon-blue shadow-md"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {t('registerNow')}
            </span>
          </button>
        </div>

        {/* --- MAIN AUTH CARD (Cyber / Glassmorphism) --- */}
        <motion.div
          animate={{
            x: shake ? [0, -12, 12, -8, 8, 0] : 0,
          }}
          transition={{ duration: 0.4 }}
          className="relative rounded-3xl p-7 sm:p-8 dark:bg-[#0e1626]/85 bg-white/95 border border-slate-200 dark:border-blue-500/20 shadow-2xl backdrop-blur-2xl transition-all duration-300 dark:shadow-[0_0_50px_-10px_rgba(59,130,246,0.25)] shadow-slate-200/60"
        >
          {/* Top subtle highlight line */}
          <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent"></div>

          {/* Title Area */}
          <div className="mb-6 text-center">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isLogin ? t('welcomeBack') : t('createNewAccount')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isLogin ? t('loginSubtitle') : t('registerSubtitle')}
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className={`p-3 rounded-xl mb-5 text-xs flex items-center gap-2.5 font-semibold border ${
                  error.includes('nhanh')
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400'
                }`}
              >
                {error.includes('nhanh') ? (
                  <ShieldAlert size={16} className="shrink-0" />
                ) : (
                  <AlertCircle size={16} className="shrink-0" />
                )}
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* FULL NAME (Chỉ khi Sign Up) */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('fullName')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <User
                    className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors pointer-events-none"
                    size={17}
                  />
                  <input
                    type="text"
                    name="fullName"
                    required={!isLogin}
                    value={formData.fullName}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    placeholder={t('fullNamePlaceholder')}
                    className="w-full py-2.5 pl-10 pr-4 text-sm rounded-xl border border-slate-300 dark:border-white/10 dark:bg-[#121c2e] bg-slate-100 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  />
                </div>
              </motion.div>
            )}

            {/* EMAIL */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('email')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors pointer-events-none"
                  size={17}
                />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  placeholder={t('emailPlaceholder')}
                  className="w-full py-2.5 pl-10 pr-4 text-sm rounded-xl border border-slate-300 dark:border-white/10 dark:bg-[#121c2e] bg-slate-100 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('password')} <span className="text-rose-500">*</span>
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleOpenForgot}
                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
                  >
                    {t('forgotPassword')}
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock
                  className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors pointer-events-none"
                  size={17}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  placeholder={t('passwordPlaceholder')}
                  className="w-full py-2.5 pl-10 pr-10 text-sm rounded-xl border border-slate-300 dark:border-white/10 dark:bg-[#121c2e] bg-slate-100 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded transition"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* REMEMBER ME (Khi Login) */}
            {isLogin && (
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                      rememberMe
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/30'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {rememberMe && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition">
                    {t('rememberMe')}
                  </span>
                </label>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-neon-blue shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isLogin ? t('loggingIn') : t('registering')}</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? t('loginNow') : t('registerNow')}</span>
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          {/* --- SOCIAL SIGN-IN DIVIDER --- */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-white/10"></div>
            </div>
            <span className="relative px-3 text-[11px] uppercase font-mono font-bold dark:bg-[#0e1626] bg-white text-slate-400 dark:text-slate-500">
              {t('orContinueWith')}
            </span>
          </div>

          {/* Social Buttons: Google & Facebook */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                alert(
                  'Đăng nhập Google: Để kích hoạt luồng đăng nhập thật, bạn cần cung cấp GOOGLE_CLIENT_ID từ Google Cloud Console.',
                )
              }
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-white/10 dark:bg-slate-800/50 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition shadow-sm active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 6.3 10.1 6.3z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() =>
                alert(
                  'Đăng nhập Facebook: Để kích hoạt luồng đăng nhập thật, bạn cần cung cấp FACEBOOK_APP_ID từ Meta for Developers.',
                )
              }
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-white/10 dark:bg-slate-800/50 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition shadow-sm active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>
        </motion.div>

        {/* --- BACK TO HOME LINK --- */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition inline-flex items-center gap-1.5 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              &larr;
            </span>{' '}
            {t('backToHome')}
          </Link>
        </div>
      </div>

      {/* --- FORGOT PASSWORD MODAL --- */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 dark:bg-[#0e1626] bg-white p-6 shadow-2xl overflow-hidden"
            >
              {/* Top ambient highlight */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500"></div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div className="flex items-start gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {forgotStep === 1 ? 'Quên mật khẩu' : 'Xác thực OTP & Đổi mật khẩu'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {forgotStep === 1
                      ? 'Nhập email tài khoản của bạn để nhận mã OTP xác minh.'
                      : `Mã OTP đã được gửi đến: ${forgotEmail}`}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {forgotError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {/* Success Message */}
              {forgotSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {/* STEP 1: Nhập email */}
              {forgotStep === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Email đăng ký <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <Mail
                        className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors pointer-events-none"
                        size={17}
                      />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full py-2.5 pl-10 pr-4 text-sm rounded-xl border border-slate-300 dark:border-white/10 dark:bg-[#121c2e] bg-slate-100 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Đang gửi mã...</span>
                      </>
                    ) : (
                      <>
                        <span>Gửi mã xác thực OTP</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Nhập OTP & Mật khẩu mới */}
              {forgotStep === 2 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Mã OTP (6 chữ số) <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        className="text-[11px] text-blue-500 hover:underline"
                      >
                        Đổi email
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full py-2.5 px-4 text-center tracking-[0.5em] font-mono text-lg font-bold rounded-xl border border-slate-300 dark:border-white/10 dark:bg-[#121c2e] bg-slate-100 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Mật khẩu mới <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <Lock
                        className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors pointer-events-none"
                        size={17}
                      />
                      <input
                        type={forgotShowPass ? 'text' : 'password'}
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full py-2.5 pl-10 pr-10 text-sm rounded-xl border border-slate-300 dark:border-white/10 dark:bg-[#121c2e] bg-slate-100 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setForgotShowPass(!forgotShowPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded transition"
                      >
                        {forgotShowPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Xác nhận đổi mật khẩu</span>
                      </>
                    )}
                  </button>

                  {/* Resend OTP */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      disabled={countdown > 0 || forgotLoading}
                      onClick={() => handleSendOtp()}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 transition"
                    >
                      <RefreshCw size={13} className={countdown > 0 ? '' : 'group-hover:rotate-180 transition-transform'} />
                      <span>
                        {countdown > 0
                          ? `Gửi lại mã sau ${countdown}s`
                          : 'Chưa nhận được mã? Gửi lại'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
