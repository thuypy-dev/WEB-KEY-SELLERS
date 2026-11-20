import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Sun, Moon, X, Package, User, ShoppingCart, Loader, Sparkles, Home, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../store/axiosClient';
import useThemeStore from '../../store/useThemeStore';
import useLanguageStore from '../../store/useLanguageStore';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const AdminHeader = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useLanguageStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Phím tắt Ctrl + K cho Admin
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- 1. LOGIC GỌI API (DEBOUNCE) ---
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/admin/search?q=${query}`);
        setResults(res);
        setShowDropdown(true);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
    setShowDropdown(false);
    setQuery('');
  };

  const hasResults =
    results &&
    (results.orders?.length > 0 ||
      results.products?.length > 0 ||
      results.users?.length > 0);

  return (
    <header className="h-16 glass-panel border-b border-slate-200 dark:border-white/10 dark:bg-[#0b0f19]/85 bg-white/90 flex items-center justify-between px-6 sticky top-0 z-30 transition-colors duration-200">
      {/* --- SEARCH BAR --- */}
      <div className="relative w-96 hidden md:block" ref={searchRef}>
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            placeholder={t('adminSearchPlaceholder')}
            className="w-full dark:bg-[#111827] bg-slate-100 border border-slate-200 dark:border-white/10 dark:text-gray-200 text-slate-900 text-sm rounded-xl py-2 pl-10 pr-20 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <Search className="absolute left-3 text-slate-400 dark:text-slate-500" size={17} />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            {loading && <Loader className="text-blue-500 animate-spin" size={16} />}
            {query && !loading && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={15} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 bg-white text-slate-500 border border-slate-300 shadow-sm pointer-events-none">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* --- DROPDOWN KẾT QUẢ --- */}
        {showDropdown && (
          <div className="absolute top-full mt-2 left-0 w-full dark:bg-[#111827] bg-white border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto">
            {!hasResults && !loading && (
              <div className="p-4 text-center text-slate-500 text-sm">
                Không tìm thấy kết quả nào.
              </div>
            )}

            {/* 1. KẾT QUẢ ĐƠN HÀNG */}
            {results?.orders?.length > 0 && (
              <div>
                <div className="px-4 py-2 dark:bg-slate-800/50 bg-slate-100 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingCart size={14} className="text-indigo-400" /> Đơn hàng
                </div>
                {results.orders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => handleNavigate('/admin/orders')}
                    className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-800/80 cursor-pointer border-b border-slate-100 dark:border-slate-800/50 transition flex justify-between items-center"
                  >
                    <div>
                      <div className="text-slate-900 dark:text-white text-sm font-semibold">
                        #{ord.code}
                      </div>
                      <div className="text-xs text-slate-500">{ord.user?.email}</div>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full dark:bg-slate-800 bg-slate-200 text-blue-600 dark:text-blue-400">
                      {ord.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 2. KẾT QUẢ SẢN PHẨM */}
            {results?.products?.length > 0 && (
              <div>
                <div className="px-4 py-2 dark:bg-slate-800/50 bg-slate-100 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Package size={14} className="text-emerald-400" /> Sản phẩm
                </div>
                {results.products.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleNavigate('/admin/products')}
                    className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-800/80 cursor-pointer border-b border-slate-100 dark:border-slate-800/50 transition flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg dark:bg-slate-700 bg-slate-200 overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
                      {prod.thumbnail ? (
                        <img
                          src={prod.thumbnail}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        ''
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {prod.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. KẾT QUẢ KHÁCH HÀNG */}
            {results?.users?.length > 0 && (
              <div>
                <div className="px-4 py-2 dark:bg-slate-800/50 bg-slate-100 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <User size={14} className="text-amber-400" /> Khách hàng
                </div>
                {results.users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleNavigate('/admin/customers')}
                    className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-800/80 cursor-pointer transition"
                  >
                    <div className="text-slate-900 dark:text-white text-sm font-semibold">
                      {u.fullName || 'Chưa đặt tên'}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions Right (Quay lại Trang chủ + Language Switcher + Theme Switcher + Notification) */}
      <div className="flex items-center gap-2.5">
        {/* NÚT QUAY LẠI TRANG CHỦ */}
        <Link
          to="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 transition shadow-sm"
          title={t('backToHome')}
        >
          <Home size={15} className="text-blue-500" />
          <span className="hidden sm:inline">{t('backToHome')}</span>
        </Link>

        {/* NÚT CHUYỂN ĐỔI NGÔN NGỮ */}
        <LanguageSwitcher />

        {/* NÚT CHUYỂN ĐỔI THEME */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 transition-colors"
          title={theme === 'dark' ? t('themeLight') : t('themeDark')}
        >
          {theme === 'dark' ? (
            <Sun size={19} className="text-amber-400" />
          ) : (
            <Moon size={19} className="text-slate-700" />
          )}
        </button>

        <button className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 transition-colors relative">
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
