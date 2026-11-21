import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, QrCode, ArrowLeft, Loader, Copy, Check, Download, AlertCircle } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import axiosClient from '../store/axiosClient';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    amount,
  );

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Cấu hình thông tin thanh toán ngân hàng (ưu tiên biến môi trường VITE_ hoặc mặc định)
  const BANK_ID = import.meta.env.VITE_BANK_ID || 'MB';
  const BANK_NAME = import.meta.env.VITE_BANK_NAME || 'MB Bank (Ngân hàng Quân Đội)';
  const BANK_ACCOUNT_NO = import.meta.env.VITE_BANK_ACCOUNT_NO || '0788829507';
  const BANK_ACCOUNT_NAME = import.meta.env.VITE_BANK_ACCOUNT_NAME || 'PHAN DUC THUY';

  // Tính tổng tiền
  const totalAmount = cart.reduce((total, item) => {
    const price = parseFloat(item.selectedVariant?.price || item.price) || 0;
    return total + price * item.quantity;
  }, 0);

  // Nội dung chuyển khoản duy nhất cho đơn hàng
  const transferContent = `PDTKEY ${user?.id ? user.id.slice(-6).toUpperCase() : 'ORDER'}`;

  // Link mã VietQR thật động tạo chuẩn NAPAS 24/7
  const vietQrUrl = `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACCOUNT_NO}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_ACCOUNT_NAME)}`;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    // Check login ở client trước cho nhanh
    if (!user) {
      alert('Vui lòng đăng nhập để thanh toán!');
      navigate('/login');
      return;
    }

    setLoading(true);

    // LỌC DỮ LIỆU: Chỉ lấy những item có variantId hợp lệ (khác 0)
    const validItems = cart
      .map((item) => ({
        variantId: parseInt(item.selectedVariant?.id || 0), // Ép kiểu về số nguyên (Int) để tránh lỗi Prisma
        quantity: item.quantity,
        price: parseFloat(item.selectedVariant?.price || item.price) || 0,
      }))
      .filter(
        (item) =>
          !isNaN(item.variantId) && item.variantId !== 0 && item.quantity > 0,
      );

    if (validItems.length === 0) {
      alert(
        'Giỏ hàng có sản phẩm lỗi (không xác định được gói). Vui lòng xóa và chọn lại.',
      );
      setLoading(false);
      return;
    }

    // Chuẩn bị dữ liệu (Backend sẽ lấy userId từ Token, nhưng gửi thêm cũng không sao)
    const orderData = {
      userId: user.id, // Dữ liệu này thực tế backend sẽ override bằng Token
      totalAmount: totalAmount,
      items: validItems,
    };

    console.log('📦 Dữ liệu gửi đi thanh toán:', orderData); // Xem log này trong Console (F12) để debug

    try {
      // --- SỬA ĐỔI: Dùng axiosClient ---
      // Token tự động được gắn vào Header
      const response = await axiosClient.post('/orders', orderData);

      // Nếu chạy đến đây nghĩa là thành công (axios tự throw lỗi nếu status != 2xx)
      // alert(`Thanh toán thành công! Mã đơn: ${response.code}`); // Có thể hiện mã đơn nếu muốn

      clearCart();
      // Chuyển sang trang Success, truyền mã đơn hàng để hiển thị
      navigate(`/success?orderCode=${response.code}`);
    } catch (error) {
      console.error('Lỗi thanh toán:', error);

      // Xử lý lỗi từ Backend trả về
      const msg =
        error.response?.data?.message || 'Không thể kết nối đến Server';
      alert(`Lỗi: ${msg}`);

      // Nếu lỗi 401 (Hết hạn token) -> logout và bắt đăng nhập lại
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0)
    return (
      <div className="text-center py-20 text-white">
        Giỏ hàng trống!{' '}
        <Link to="/" className="text-vtv-green underline">
          Về trang chủ
        </Link>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/cart"
          className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition"
        >
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white uppercase">
          Thanh toán an toàn
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- CỘT TRÁI: FORM THÔNG TIN & PHƯƠNG THỨC TT --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Thông tin nhận hàng */}
          <div className="bg-vtv-card border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="bg-vtv-green text-black w-6 h-6 rounded-full flex items-center justify-center text-xs">
                1
              </span>
              Thông tin nhận Key
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Email nhận hàng (Bắt buộc)
                </label>
                <input
                  type="email"
                  defaultValue={user?.email || ''}
                  readOnly
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-gray-400 focus:border-vtv-green outline-none cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Key bản quyền sẽ được gửi tự động qua email này.
                </p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Số điện thoại (Tùy chọn)
                </label>
                <input
                  type="tel"
                  placeholder="0788..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-vtv-green outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Phương thức thanh toán */}
          <div className="bg-vtv-card border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="bg-vtv-green text-black w-6 h-6 rounded-full flex items-center justify-center text-xs">
                2
              </span>
              Phương thức thanh toán
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between bg-slate-800/50 border border-vtv-green p-4 rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-4 border-vtv-green bg-white"></div>
                  <div className="flex items-center gap-2 text-white font-bold">
                    <QrCode className="text-vtv-green" /> Chuyển khoản ngân hàng
                    (VietQR)
                  </div>
                </div>
                <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                  Khuyên dùng
                </span>
              </label>
            </div>
            {/* Khu vực hiển thị VietQR Thật */}
            <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl max-w-md mx-auto shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Mã VietQR Thanh Toán
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Napas 24/7 Tức thì
                </span>
              </div>

              {/* Ảnh QR thật tự động sinh từ VietQR */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center mb-4">
                <img
                  src={vietQrUrl}
                  alt="Mã thanh toán VietQR"
                  className="w-full max-w-[280px] h-auto object-contain rounded-lg"
                  loading="lazy"
                />
                <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Quét mã qua mọi App ngân hàng & Ví điện tử
                </p>
              </div>

              {/* Thông tin chuyển khoản chi tiết & Nút Copy nhanh */}
              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">Ngân hàng:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{BANK_NAME}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                      {BANK_ACCOUNT_NO}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(BANK_ACCOUNT_NO, 'stk')}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-white transition"
                      title="Sao chép số tài khoản"
                    >
                      {copiedField === 'stk' ? (
                        <Check size={14} className="text-emerald-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{BANK_ACCOUNT_NAME}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">Số tiền:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalAmount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(String(totalAmount), 'amount')}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-white transition"
                      title="Sao chép số tiền"
                    >
                      {copiedField === 'amount' ? (
                        <Check size={14} className="text-emerald-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/20">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Nội dung CK:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-300">
                      {transferContent}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(transferContent, 'content')}
                      className="p-1 rounded text-blue-500 hover:text-blue-700 dark:hover:text-white transition"
                      title="Sao chép nội dung chuyển khoản"
                    >
                      {copiedField === 'content' ? (
                        <Check size={14} className="text-emerald-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-300">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Vui lòng giữ nguyên <strong>Nội dung chuyển khoản</strong> để hệ thống tự động xác nhận đơn hàng nhanh nhất.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- CỘT PHẢI --- */}
        <div className="lg:col-span-1">
          <div className="bg-vtv-card border border-slate-700 rounded-xl p-6 sticky top-24 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-4">
              Đơn hàng của bạn
            </h3>

            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex justify-between items-start text-sm"
                >
                  <div className="text-gray-300">
                    <span className="text-white font-bold">
                      {item.quantity}x
                    </span>{' '}
                    {item.name}
                    <div className="text-xs text-gray-500">
                      {item.selectedVariant?.name}
                    </div>
                  </div>
                  <div className="text-white font-medium">
                    {formatCurrency(
                      (item.selectedVariant?.price || item.price) *
                        item.quantity,
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-6 pt-4 border-t border-slate-700">
              <span className="text-white font-bold text-lg">
                Tổng thanh toán:
              </span>
              <span className="text-2xl font-bold text-vtv-green">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-vtv-green text-black font-bold py-3.5 rounded-xl hover:bg-green-400 transition shadow-lg shadow-green-500/20 mb-4 flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} /> Đang xử lý...
                </>
              ) : (
                'XÁC NHẬN THANH TOÁN'
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <ShieldCheck size={16} className="text-green-500" /> Bảo mật SSL
              256-bit
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
