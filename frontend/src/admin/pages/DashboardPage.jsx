import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, DollarSign, Package, Users, 
  ArrowUpRight, ShoppingCart, Clock, Crown, Zap, Sparkles 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import axiosClient from '../../store/axiosClient';

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await axiosClient.get('/admin/dashboard');
      setData(res);
    } catch (error) {
      console.error("Lỗi tải dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleHot = async (productId, currentStatus) => {
    if(!window.confirm(`Bạn có muốn ${currentStatus ? 'tắt' : 'bật'} HOT cho sản phẩm này?`)) return;
    try {
      await axiosClient.patch(`/admin/product/${productId}`, { isHot: !currentStatus });
      alert("Đã cập nhật trạng thái HOT!");
      fetchDashboard();
    } catch (error) {
      alert("Lỗi cập nhật: " + error.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-500 font-mono text-sm">
      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mr-3"></div>
      Đang tải dữ liệu thống kê...
    </div>
  );
  if (!data) return <div className="text-slate-500 p-8 text-center font-mono">Không có dữ liệu.</div>;

  const { stats, chartData, recentOrders, bestSellers } = data;

  const statsConfig = [
    { title: 'Doanh thu', value: formatCurrency(stats.revenue), icon: DollarSign, color: 'text-emerald-500', bg: 'dark:bg-emerald-500/10 bg-emerald-50 text-emerald-600', border: 'border-emerald-200 dark:border-emerald-500/20' },
    { title: 'Đơn hàng', value: stats.orders, icon: Package, color: 'text-blue-500', bg: 'dark:bg-blue-500/10 bg-blue-50 text-blue-600', border: 'border-blue-200 dark:border-blue-500/20' },
    { title: 'Khách hàng', value: stats.users, icon: Users, color: 'text-purple-500', bg: 'dark:bg-purple-500/10 bg-purple-50 text-purple-600', border: 'border-purple-200 dark:border-purple-500/20' },
    { title: 'Sản phẩm', value: stats.products, icon: ShoppingCart, color: 'text-amber-500', bg: 'dark:bg-amber-500/10 bg-amber-50 text-amber-600', border: 'border-amber-200 dark:border-amber-500/20' },
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Tổng quan Dashboard</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium dark:bg-blue-500/10 dark:text-blue-400 bg-blue-50 text-blue-600 border border-blue-200 dark:border-blue-500/20">
              Real-time
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Dữ liệu kinh doanh và luồng giao dịch trực tiếp từ MySQL</p>
        </div>
      </div>

      {/* 1. STATS GRID (Platform v2.0 style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsConfig.map((stat, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 dark:border-white/10 dark:bg-[#111827]/75 bg-white p-5 shadow-sm backdrop-blur-md hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{stat.title}</span>
              <div className={`p-2.5 rounded-xl border ${stat.bg} ${stat.border}`}>
                <stat.icon className={stat.color} size={20} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. BIỂU ĐỒ DOANH THU */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/10 dark:bg-[#111827]/75 bg-white p-6 shadow-sm backdrop-blur-md">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500"/> Biểu đồ doanh thu (7 ngày)
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
                  itemStyle={{ color: '#60a5fa' }}
                  formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. ĐƠN HÀNG MỚI */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 dark:bg-[#111827]/75 bg-white p-6 shadow-sm backdrop-blur-md flex flex-col">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-blue-500"/> Đơn mới nhất
          </h3>
          <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[300px]">
            {recentOrders.length > 0 ? recentOrders.map((order, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl dark:bg-[#0b101d] bg-slate-50 border border-slate-100 dark:border-white/5 hover:border-blue-500/30 transition">
                <div>
                  <div className="text-slate-900 dark:text-white font-semibold text-sm truncate w-32">{order.user?.fullName || 'Khách lẻ'}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{new Date(order.createdAt).toLocaleTimeString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-blue-600 dark:text-blue-400 font-mono font-bold text-sm">{formatCurrency(order.totalAmount)}</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full dark:bg-emerald-500/10 dark:text-emerald-400 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:border-emerald-500/20">{order.status}</span>
                </div>
              </div>
            )) : <p className="text-slate-400 text-sm text-center py-8">Chưa có đơn hàng nào.</p>}
          </div>
        </div>
      </div>

      {/* 4. TOP SẢN PHẨM BÁN CHẠY */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 dark:bg-[#111827]/75 bg-white p-6 shadow-sm backdrop-blur-md">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
          <Crown size={19} className="text-amber-500"/> Top sản phẩm bán chạy (Cần đẩy HOT 🔥)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="dark:bg-slate-900/60 bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100 dark:border-white/5">
              <tr>
                <th className="p-3.5 rounded-l-xl">Sản phẩm</th>
                <th className="p-3.5 text-center">Đã bán</th>
                <th className="p-3.5 text-right">Doanh thu gói</th>
                <th className="p-3.5 text-center rounded-r-xl">Trạng thái HOT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {bestSellers.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl dark:bg-slate-800 bg-slate-100 overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                      {item.thumbnail ? <img src={item.thumbnail} className="w-full h-full object-cover" alt=""/> : '📦'}
                    </div>
                    <div>
                      <div className="text-slate-900 dark:text-white font-bold">{item.productName}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">{item.variantName}</div>
                    </div>
                  </td>
                  <td className="p-3.5 text-center text-slate-900 dark:text-white font-mono font-bold">{item.sold}</td>
                  <td className="p-3.5 text-right text-emerald-600 dark:text-emerald-400 font-mono font-semibold">{formatCurrency(item.revenue)}</td>
                  <td className="p-3.5 text-center">
                    <button 
                      onClick={() => handleToggleHot(item.productId, item.isHot)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 mx-auto ${
                        item.isHot 
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                        : 'dark:bg-slate-800 bg-slate-100 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {item.isHot ? <><Zap size={11} fill="currentColor"/> ĐANG HOT</> : 'Bình thường'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
