import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  User,
  LogOut,
  ChevronDown,
  Package,
  Loader,
  X,
  Sun,
  Moon,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import useLanguageStore from '../store/useLanguageStore';
import LanguageSwitcher from './LanguageSwitcher';
import axiosClient from '../store/axiosClient';

// Helper format tiền tệ
const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    amount,
  );

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useLanguageStore();
  const cart = useCartStore((state) => state.cart);
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  // --- STATE CHO LIVE SEARCH ---
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // --- SHORTCUT PHÍM TẮT CTRL + K ---
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

  // --- 1. LOGIC TÌM KIẾM (DEBOUNCE) ---
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/search?q=${query}`);
        setResults(res.products || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // --- 2. XỬ LÝ SỰ KIỆN ---
  const handleSearchEnter = (e) => {
    if (e.key === 'Enter') {
      navigate(`/search?q=${query}`);
      setShowDropdown(false);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  const handleLogout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    } finally {
      logout();
      setIsUserMenuOpen(false);
      navigate('/');
    }
  };

  // Click outside để đóng menu & search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200 dark:border-white/10 dark:bg-[#0b0f19]/85 bg-white/90 shadow-sm transition-colors duration-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* LOGO */}
        <Link
          to="/"
          className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-neon-blue shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles size={16} />
          </div>
          <span>
            PDT<span className="text-blue-600 dark:text-blue-400">KEY</span>
          </span>
        </Link>

        {/* --- SEARCH BAR WITH CTRL+K (Platform v2.0 style) --- */}
        <div
          className="flex-1 max-w-xl relative hidden md:block"
          ref={searchRef}
        >
          <div className="relative flex items-center">
            <Search
              className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none"
              size={18}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.length >= 2 && setShowDropdown(true)}
              onKeyDown={handleSearchEnter}
              placeholder={t('searchPlaceholder')}
              className="w-full dark:bg-[#111827] bg-slate-100/90 border border-slate-300 dark:border-white/10 text-sm rounded-xl py-2.5 pl-10 pr-24 dark:text-white text-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition-all focus:ring-2 focus:ring-blue-500/20 shadow-inner"
            />

            {/* Phím tắt Ctrl K badge + Clear / Loading */}
            <div className="absolute right-3 flex items-center gap-1.5">
              {loading ? (
                <Loader
                  className="text-blue-500 animate-spin"
                  size={16}
                />
              ) : query ? (
                <button
                  onClick={handleClearSearch}
                  className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X size={15} />
                </button>
              ) : null}

              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 bg-white text-slate-500 border border-slate-300 shadow-sm pointer-events-none">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          {/* --- DROPDOWN KẾT QUẢ --- */}
          {showDropdown && query.length >= 2 && (
            <div className="absolute top-full mt-2 left-0 w-full dark:bg-[#111827] bg-white border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto">
              {results.length > 0 ? (
                <>
                  <div className="px-4 py-2 dark:bg-slate-800/50 bg-slate-100 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Sản phẩm gợi ý
                  </div>
                  {results.map((prod) => {
                    const minPrice =
                      prod.variants?.length > 0
                        ? Math.min(...prod.variants.map((v) => Number(v.price)))
                        : 0;

                    return (
                      <Link
                        key={prod.id}
                        to={`/product/${prod.slug || prod.id}`}
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800/50 last:border-0 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg dark:bg-slate-800 bg-slate-200 overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
                          {prod.thumbnail ? (
                            <img
                              src={prod.thumbnail}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm">
                              📦
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                            {prod.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-blue-600 dark:text-blue-400 font-mono font-semibold">
                              {minPrice > 0
                                ? formatCurrency(minPrice)
                                : 'Liên hệ'}
                            </span>
                            <span className="text-slate-400">
                              • {prod.category?.name || 'Phần mềm'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}

                  <button
                    onClick={() => {
                      navigate(`/search?q=${query}`);
                      setShowDropdown(false);
                    }}
                    className="w-full py-3 text-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition block"
                  >
                    {t('allResultsFor')} "{query}" &rarr;
                  </button>
                </>
              ) : (
                !loading && (
                  <div className="p-6 text-center text-slate-500">
                    <p>{t('noResultsFound')}</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* USER ACTIONS & THEME TOGGLE */}
        <div className="flex items-center gap-3 text-sm font-bold">
          {/* LANGUAGE SWITCHER (VN / EN) */}
          <LanguageSwitcher />

          {/* THEME TOGGLE BUTTON (Dark / Light) */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 transition-colors"
            title={theme === 'dark' ? t('themeLight') : t('themeDark')}
          >
            {theme === 'dark' ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} className="text-slate-700" />}
          </button>

          {/* GIỎ HÀNG */}
          <Link
            to="/cart"
            className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition relative group px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60"
          >
            <div className="relative">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce shadow-sm font-mono">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="hidden sm:block">{t('cart')}</span>
          </Link>

          {/* TÀI KHOẢN */}
          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2.5 border-l border-slate-200 dark:border-slate-800 pl-4 transition ${
                  isUserMenuOpen
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <User size={16} />
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none">
                  <span className="text-sm font-semibold max-w-[120px] truncate">
                    {user?.fullName || 'Thành viên'}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Menu Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-3 w-64 dark:bg-[#111827] bg-white border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 dark:bg-slate-800/40 bg-slate-50">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[11px] text-slate-400 uppercase font-mono font-bold">
                        {t('account')}
                      </p>
                      {['ADMIN', 'SUPPORT', 'STAFF'].includes(String(user?.role || '').toUpperCase()) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                          {String(user?.role).toUpperCase() === 'ADMIN' ? t('admin') : (String(user?.role).toUpperCase() === 'STAFF' ? 'Nhân viên' : t('supporter'))}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-900 dark:text-white font-bold truncate">
                      {user?.fullName || t('member')}
                    </p>
                    <p className="text-xs text-slate-500 truncate font-mono">
                      {user?.email}
                    </p>
                  </div>
                  <div className="p-2 space-y-1">
                    {/* NẾU LÀ ADMIN, SUPPORT HOẶC STAFF THÌ HIỆN NÚT TỚI TRANG QUẢN TRỊ */}
                    {Boolean(user && ['ADMIN', 'SUPPORT', 'STAFF'].includes(String(user.role || '').toUpperCase())) && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl flex items-center gap-3 transition text-sm font-bold bg-blue-50/60 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/30 shadow-sm"
                      >
                        <LayoutDashboard size={16} className="text-blue-600 dark:text-blue-400" /> {t('adminDashboard')}
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full text-left p-2.5 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-3 transition text-sm"
                    >
                      <User size={16} className="text-blue-500" /> {t('profile')}
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full text-left p-2.5 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-3 transition text-sm"
                    >
                      <Package size={16} className="text-indigo-500" /> {t('orderHistory')}
                    </Link>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition text-sm font-semibold"
                    >
                      <LogOut size={16} /> {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition border-l border-slate-200 dark:border-slate-800 pl-4"
            >
              <div className="w-8 h-8 rounded-full dark:bg-slate-800 bg-slate-100 flex items-center justify-center text-slate-700 dark:text-slate-300">
                <User size={16} />
              </div>
              <span className="hidden sm:block">{t('login')}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
