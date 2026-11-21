import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Users,
  FolderTree,
  Settings,
  Menu,
  X,
  Package,
  LogOut,
  MessageSquare,
  Sparkles,
  Home,
} from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';
import useLanguageStore from '../../store/useLanguageStore';
import axiosClient from '../../store/axiosClient';

const SIDEBAR_ITEMS = [
  { key: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { key: 'products', name: 'Sản phẩm', icon: ShoppingBag, path: '/admin/products' },
  { key: 'reviews', name: 'Đánh giá', icon: MessageSquare, path: '/admin/reviews' },
  { key: 'categories', name: 'Danh mục', icon: FolderTree, path: '/admin/categories' },
  { key: 'orders', name: 'Đơn hàng', icon: ShoppingCart, path: '/admin/orders' },
  { key: 'inventory', name: 'Kho hàng', icon: Package, path: '/admin/stock' }, 
  { key: 'customers', name: 'Khách hàng', icon: Users, path: '/admin/customers' },
  { key: 'staff', name: 'Nhân viên', icon: Users, path: '/admin/staff' },
  { key: 'settings', name: 'Cài đặt', icon: Settings, path: '/admin/settings' },
];

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();

  // Phím tắt Ctrl + B để đóng/mở Sidebar (giống Platform v2.0)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất khỏi Admin?')) {
      try {
        await axiosClient.post('/auth/logout');
      } catch (error) {
        console.error(error);
      } finally {
        logout();
        navigate('/login');
      }
    }
  };

  return (
    <motion.div
      animate={{ width: isCollapsed ? 80 : 260 }}
      className="dark:bg-[#0d1117] bg-white border-r border-slate-200 dark:border-white/10 h-screen sticky top-0 flex flex-col z-20 transition-all duration-300 shadow-xl"
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-white/10 shrink-0">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-neon-blue shadow-sm">
              <Sparkles size={16} />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
              PDT<span className="text-blue-600 dark:text-blue-400">ADMIN</span>
            </span>
          </motion.div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition ml-auto"
          title={isCollapsed ? 'Mở rộng (Ctrl + B)' : 'Thu gọn (Ctrl + B)'}
        >
          {isCollapsed ? <Menu size={19} /> : <X size={19} />}
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-3">
          {/* Nút Quay lại Trang chủ */}
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 mb-3 group shadow-sm"
            title="Quay lại Trang chủ"
          >
            <Home size={20} className="flex-shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap text-sm font-bold">
                {t('storefrontLink')}
              </span>
            )}
          </Link>

          {SIDEBAR_ITEMS.filter((item) => {
            // Nhân viên hỗ trợ (SUPPORT) không được xem mục quản lý nhân viên và cài đặt hệ thống
            if (String(user?.role).toUpperCase() === 'SUPPORT' && (item.key === 'staff' || item.key === 'settings')) {
              return false;
            }
            return true;
          }).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'} 
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-neon-blue shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-white'
                }
              `}
            >
              <item.icon size={20} className="flex-shrink-0" />

              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="whitespace-nowrap text-sm font-medium"
                >
                  {t(item.key, item.name)}
                </motion.span>
              )}

              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 dark:bg-slate-800 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {t(item.key, item.name)}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer (User Info + Logout) */}
      <div className="p-4 border-t border-slate-200 dark:border-white/10 shrink-0">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center flex-col' : ''}`}>
          
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md uppercase shrink-0 cursor-default">
            {user?.fullName ? user.fullName.substring(0, 2) : 'AD'}
          </div>

          {/* Info & Logout Button */}
          {!isCollapsed ? (
            <div className="flex-1 overflow-hidden flex justify-between items-center">
              <div className="min-w-0 mr-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user?.fullName || 'Quản trị viên'}
                </p>
                <p className="text-xs text-slate-400 truncate font-mono">
                  {user?.email || 'admin@vtvkey.com'}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition"
                title="Đăng xuất"
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogout}
              className="mt-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition"
              title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminSidebar;
