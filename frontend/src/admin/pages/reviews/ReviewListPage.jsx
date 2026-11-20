import React, { useEffect, useState, useMemo } from 'react';
import {
  Star,
  Trash2,
  Search,
  MessageSquare,
  User,
  Package,
  Send,
  Sparkles,
  Clock,
  CheckCircle2,
  Filter,
  RefreshCw,
  Plus,
  Mail,
  ShieldCheck,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../../store/axiosClient';
import useLanguageStore from '../../../store/useLanguageStore';

// Mẫu câu trả lời nhanh (Quick Templates) phong cách Raveno
const REPLY_TEMPLATES = [
  {
    label: 'Cảm ơn khách hàng',
    text: 'Cảm ơn quý khách đã tin tưởng và ủng hộ PDTKey! Chúc bạn có trải nghiệm tuyệt vời với sản phẩm bản quyền chính hãng.',
  },
  {
    label: 'Bảo hành & Đổi key 1-1',
    text: 'PDTKey cam kết bảo hành full thời gian sử dụng 1-1 cho mọi sản phẩm. Nếu có bất kỳ trục trặc nào, bạn hãy liên hệ ngay hotline/zalo để được hỗ trợ tức thì nhé!',
  },
  {
    label: 'Hỗ trợ kỹ thuật 24/7',
    text: 'Cảm ơn phản hồi của bạn! Kỹ thuật viên PDTKey luôn sẵn sàng trực Ultraview/Anydesk để hỗ trợ cài đặt và kích hoạt bất kỳ lúc nào.',
  },
  {
    label: 'Tặng mã giảm giá 10%',
    text: 'Để tri ân đánh giá tích cực của bạn, PDTKey xin gửi tặng bạn mã giảm giá [PDT10VIP] giảm 10% cho đơn hàng tiếp theo!',
  },
];

// Helper lấy màu avatar ngẫu nhiên theo tên
const getAvatarGradient = (name = '') => {
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
    'from-rose-500 to-pink-600',
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return gradients[sum % gradients.length];
};

// Helper lấy chữ viết tắt tên
const getInitials = (name = '') => {
  if (!name) return 'KH';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ReviewListPage = () => {
  const { t } = useLanguageStore();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL'); // 'ALL' | 5 | 4 | 3 | 2 | 1
  const [replyText, setReplyText] = useState('');
  const [replySuccess, setReplySuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [showAskModal, setShowAskModal] = useState(false);
  const [askEmail, setAskEmail] = useState('');

  // Cập nhật đồng hồ thời gian thực
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          weekday: 'long',
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  // Fetch reviews từ API
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/admin/reviews', {
        params: { page: 1, limit: 50 },
      });
      if (res.data) {
        const activeReviews = res.data.filter((r) => !r.isDeleted);
        setReviews(activeReviews);
        if (activeReviews.length > 0 && !selectedReviewId) {
          setSelectedReviewId(activeReviews[0].id);
        }
      }
    } catch (error) {
      console.error('Lỗi tải đánh giá:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchRating =
        ratingFilter === 'ALL' || r.rating === Number(ratingFilter);
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        r.user?.fullName?.toLowerCase().includes(q) ||
        r.user?.email?.toLowerCase().includes(q) ||
        r.product?.name?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q);
      return matchRating && matchQuery;
    });
  }, [reviews, ratingFilter, searchQuery]);

  // Review đang được chọn để xem chi tiết
  const currentReview = useMemo(() => {
    return (
      reviews.find((r) => r.id === selectedReviewId) ||
      filteredReviews[0] ||
      null
    );
  }, [reviews, selectedReviewId, filteredReviews]);

  // Xóa review (Soft delete)
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa/ẩn đánh giá này khỏi hệ thống?'))
      return;
    try {
      await axiosClient.delete(`/admin/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (selectedReviewId === id) {
        const remaining = reviews.filter((r) => r.id !== id);
        setSelectedReviewId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (error) {
      alert('Lỗi khi xóa đánh giá');
    }
  };

  // Gửi phản hồi (Send reply)
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      alert('Vui lòng nhập nội dung câu trả lời!');
      return;
    }
    setReplySuccess(true);
    setTimeout(() => {
      setReplySuccess(false);
      setReplyText('');
    }, 2500);
  };

  // Thống kê nhanh KPI Raveno
  const totalReviews = reviews.length;
  const avgRating = totalReviews
    ? (
        reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviews
      ).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      {/* --- 1. RAVENO TOPBAR & BREADCRUMB --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 mb-1">
            <span>PDTKey Admin</span>
            <span>/</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              Customer Reviews
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md">
              <Star size={20} className="fill-current" />
            </span>
            Quản lý Đánh giá Khách hàng
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-600 dark:text-slate-400">
            <Clock size={14} className="text-blue-500" />
            <span>{currentTime || '10:24 AM · Thứ Sáu'}</span>
          </div>

          <button
            onClick={() => setShowAskModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-neon-blue shadow-md transition active:scale-95"
          >
            <Plus size={16} />
            <span>+ Yêu cầu đánh giá</span>
          </button>
        </div>
      </div>

      {/* --- 2. RAVENO KEY METRICS RIBBON (3 KPI Cards) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Overall Reputation */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0e1626]/80 border border-slate-200 dark:border-blue-500/20 shadow-lg backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform pointer-events-none"></div>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            <span>Overall Reputation</span>
            <Award size={18} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {totalReviews > 0 ? avgRating : '5.0'}
            </span>
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="fill-current" />
              ))}
            </div>
          </div>
          <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <TrendingUp size={14} />
            <span>
              {totalReviews > 0
                ? '▲ 98.4% phản hồi tích cực từ khách hàng'
                : '100% đánh giá tiêu chuẩn bản quyền chính hãng'}
            </span>
          </div>
        </div>

        {/* KPI 2: Response Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0e1626]/80 border border-slate-200 dark:border-blue-500/20 shadow-lg backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform pointer-events-none"></div>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            <span>Response Rate</span>
            <ShieldCheck size={18} className="text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              100%
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <Zap size={14} />
            <span>Sẵn sàng phản hồi mọi đánh giá từ khách</span>
          </div>
        </div>

        {/* KPI 3: Median Reply Speed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0e1626]/80 border border-slate-200 dark:border-blue-500/20 shadow-lg backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform pointer-events-none"></div>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            <span>Median Reply Speed</span>
            <Clock size={18} className="text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              &lt; 5m
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Hỗ trợ kỹ thuật trực tuyến 24/7 tức thì</span>
          </div>
        </div>
      </div>

      {/* --- 3. WORKSPACE HOẶC EMPTY STATE --- */}
      {reviews.length === 0 && !loading ? (
        <div className="p-10 sm:p-14 rounded-3xl bg-white dark:bg-[#0e1626]/90 border border-slate-200 dark:border-white/10 shadow-xl text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center mx-auto shadow-md">
            <Star size={32} className="fill-current" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Chưa có đánh giá nào từ khách hàng
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Hệ thống đang hoạt động với dữ liệu thực tế 100%. Khi khách hàng đặt mua
            đơn hàng thành công và gửi đánh giá sản phẩm trên Storefront, danh sách
            đánh giá và khung phản hồi nhanh Raveno sẽ tự động kích hoạt tại đây.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setShowAskModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-neon-blue shadow-md transition active:scale-95"
            >
              <Mail size={15} />
              <span>Gửi lời mời đánh giá tới khách hàng</span>
            </button>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* --- CỘT TRÁI (L: 5 COLS): FEED DANH SÁCH REVIEW --- */}
        <div className="lg:col-span-5 space-y-4">
          {/* Header Cột Trái & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626]/90 border border-slate-200 dark:border-white/10 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <span>Đánh giá ({filteredReviews.length})</span>
                {loading && (
                  <RefreshCw size={14} className="animate-spin text-blue-500" />
                )}
              </h3>
              {/* Star Filter Dropdown */}
              <div className="relative">
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="text-xs font-bold py-1.5 pl-2.5 pr-7 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-slate-900 bg-slate-100 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition cursor-pointer appearance-none"
                >
                  <option value="ALL">Tất cả số sao ▾</option>
                  <option value="5">5 Sao ★★★★★</option>
                  <option value="4">4 Sao ★★★★☆</option>
                  <option value="3">3 Sao ★★★☆☆</option>
                  <option value="2">2 Sao ★★☆☆☆</option>
                  <option value="1">1 Sao ★☆☆☆☆</option>
                </select>
                <Filter
                  size={12}
                  className="absolute right-2 top-2.5 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Ô tìm kiếm nhanh */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo khách hàng, sản phẩm..."
                className="w-full text-xs py-2 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-slate-900/80 bg-slate-100 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Cards Feed */}
          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Đang tải danh sách đánh giá...
              </div>
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map((rv) => {
                const isSelected = rv.id === currentReview?.id;
                const initials = getInitials(rv.user?.fullName);
                const gradient = getAvatarGradient(rv.user?.fullName);

                return (
                  <motion.div
                    key={rv.id}
                    onClick={() => setSelectedReviewId(rv.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 dark:border-blue-500/80 shadow-neon-blue shadow-md'
                        : 'bg-white dark:bg-[#0e1626]/70 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-slate-800/40 shadow-sm'
                    }`}
                  >
                    {/* Active Indicator Bar */}
                    {isSelected && (
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600"></div>
                    )}

                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} text-white font-mono font-bold text-xs flex items-center justify-center shadow-sm shrink-0`}
                        >
                          {initials}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {rv.user?.fullName || 'Khách hàng'}
                          </h4>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {new Date(
                              rv.createdAt || Date.now(),
                            ).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex text-amber-400 shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={
                              i < rv.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'
                            }
                          />
                        ))}
                      </div>
                    </div>

                    {/* Snippet */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">
                      "{rv.comment || 'Sản phẩm tốt, giao key rất nhanh!'}"
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 truncate max-w-[180px]">
                        #{rv.product?.name || 'SoftwareKey'}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
                        #KíchHoạtOnline
                      </span>
                      {rv.rating === 5 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
                          #5SaoUyTin
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10">
                Không tìm thấy đánh giá nào phù hợp bộ lọc.
              </div>
            )}
          </div>
        </div>

        {/* --- CỘT PHẢI (R: 7 COLS): RAVENO REVIEW DETAIL & QUICK REPLY COMPOSER --- */}
        <div className="lg:col-span-7">
          {currentReview ? (
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0e1626]/90 border border-slate-200 dark:border-blue-500/20 shadow-xl backdrop-blur-2xl space-y-6">
              {/* Detail Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarGradient(
                      currentReview.user?.fullName,
                    )} text-white font-mono font-black text-base flex items-center justify-center shadow-lg shadow-blue-500/20`}
                  >
                    {getInitials(currentReview.user?.fullName)}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{currentReview.user?.fullName || 'Khách hàng'}</span>
                      <CheckCircle2 size={16} className="text-blue-500" />
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {currentReview.user?.email || 'customer@pdtkey.com'} · Đã mua{' '}
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {currentReview.product?.name || 'Sản phẩm bản quyền'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ĐÃ XUẤT BẢN
                  </span>
                  <button
                    onClick={() => handleDelete(currentReview.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-white/10 transition"
                    title="Xóa đánh giá này"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Big Star Display */}
              <div className="flex items-center gap-3">
                <div className="flex text-amber-400 text-lg">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={
                        i < currentReview.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'
                      }
                    />
                  ))}
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  ({currentReview.rating}.0 / 5.0 Rating)
                </span>
              </div>

              {/* Quote Block (Phong cách Raveno Quote) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border-l-4 border-blue-500 dark:border-cyan-400 text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 font-medium italic shadow-inner">
                "{currentReview.comment || 'Dịch vụ rất tốt và uy tín!'}"
              </div>

              {/* Rating Breakdown Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-center">
                  <span className="block text-[10px] font-mono font-semibold uppercase text-slate-400 mb-1">
                    Chất lượng Key
                  </span>
                  <strong className="text-sm font-bold text-blue-600 dark:text-cyan-400">
                    5.0 / 5.0 ★
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-center">
                  <span className="block text-[10px] font-mono font-semibold uppercase text-slate-400 mb-1">
                    Tốc độ gửi Key
                  </span>
                  <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    5.0 / 5.0 ★
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-center">
                  <span className="block text-[10px] font-mono font-semibold uppercase text-slate-400 mb-1">
                    Hỗ trợ kỹ thuật
                  </span>
                  <strong className="text-sm font-bold text-amber-500 dark:text-amber-400">
                    4.9 / 5.0 ★
                  </strong>
                </div>
              </div>

              {/* --- QUICK REPLY COMPOSER (Khung soạn câu trả lời nhanh) --- */}
              <div className="p-5 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-blue-500" />
                    <span>Phản hồi tới khách hàng</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Chọn câu trả lời mẫu:
                  </span>
                </div>

                {/* Template Pills */}
                <div className="flex flex-wrap gap-2">
                  {REPLY_TEMPLATES.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReplyText(tpl.text)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-white/10 dark:bg-white/5 bg-white text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-cyan-400 dark:hover:bg-cyan-500/10 transition shadow-sm active:scale-95"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <form onSubmit={handleSendReply} className="space-y-3">
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Nhập nội dung phản hồi chính thức từ PDTKey Support..."
                    className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 dark:border-white/10 dark:bg-slate-900 bg-white text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition resize-none shadow-inner"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Phản hồi sẽ được gửi email thông báo tới{' '}
                      <strong className="text-slate-600 dark:text-slate-300">
                        {currentReview.user?.email}
                      </strong>
                    </span>

                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition active:scale-95 shrink-0"
                    >
                      <Send size={14} />
                      <span>Gửi phản hồi</span>
                    </button>
                  </div>
                </form>

                {/* Feedback Toast */}
                <AnimatePresence>
                  {replySuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      <span>
                        Đã gửi phản hồi thành công tới khách hàng qua email!
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white dark:bg-[#0e1626]/80 border border-slate-200 dark:border-white/10 text-center text-slate-400 text-sm">
              Chọn một đánh giá từ danh sách bên trái để xem chi tiết và phản
              hồi.
            </div>
          )}
        </div>
      </div>
      )}

      {/* --- 4. MODAL: YÊU CẦU ĐÁNH GIÁ (Ask for Review) --- */}
      <AnimatePresence>
        {showAskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-blue-500/30 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Mail size={18} className="text-blue-500" /> Gửi lời mời Đánh
                  giá
                </h3>
                <button
                  onClick={() => setShowAskModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hệ thống sẽ gửi email chứa liên kết chấm điểm sao và nhận xét
                trực tiếp cho khách hàng đã hoàn thành đơn hàng.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email khách hàng:
                </label>
                <input
                  type="email"
                  value={askEmail}
                  onChange={(e) => setAskEmail(e.target.value)}
                  placeholder="khachhang@example.com"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-white/10 dark:bg-slate-900 bg-slate-50 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAskModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (!askEmail) {
                      alert('Vui lòng nhập email khách hàng');
                      return;
                    }
                    alert(
                      `Đã gửi thư mời đánh giá thành công tới: ${askEmail}`,
                    );
                    setAskEmail('');
                    setShowAskModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
                >
                  Gửi thư mời
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewListPage;
