import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShieldCheck, ShoppingCart } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useLanguageStore from '../store/useLanguageStore';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    amount,
  );

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const { t } = useLanguageStore();

  const totalAmount = cart.reduce((total, item) => {
    return (
      total +
      parseFloat(item.selectedVariant?.price || item.price) * item.quantity
    );
  }, 0);

  // Giao diện khi giỏ hàng TRỐNG
  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-[#0e1626]/80 rounded-3xl p-10 max-w-xl mx-auto border border-slate-200 dark:border-white/10 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
            <ShoppingCart size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {t('emptyCart')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {t('emptyCartDesc')}
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition shadow-md inline-block text-sm"
            >
              {t('continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Giao diện khi CÓ HÀNG
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-slate-800 bg-white hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm text-slate-700 dark:text-slate-300"
          title={t('continueShopping')}
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          {t('yourCart')} ({cart.length})
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* --- CỘT TRÁI: DANH SÁCH SẢN PHẨM --- */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.cartItemId}
              className="bg-white dark:bg-[#0e1626]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-center shadow-sm"
            >
              {/* Ảnh sản phẩm */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0 overflow-hidden border border-slate-200 dark:border-white/10 p-1 flex items-center justify-center">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>

              {/* Thông tin */}
              <div className="flex-1 text-center md:text-left min-w-0">
                <h3 className="text-slate-900 dark:text-white font-bold text-base sm:text-lg truncate">
                  {item.name}
                </h3>
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                  {item.selectedVariant?.name || 'Mặc định'}
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-xs font-mono">
                  {t('unitPriceCol')}:{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(item.selectedVariant?.price || item.price)}
                  </span>
                </div>
              </div>

              {/* Bộ điều khiển số lượng */}
              <div className="flex items-center gap-2 border border-slate-200 dark:border-white/10 rounded-xl p-1 dark:bg-slate-900 bg-slate-100 shadow-inner">
                <button
                  onClick={() => updateQuantity(item.cartItemId, 'decrease')}
                  className="p-1.5 hover:text-slate-900 dark:hover:text-white text-slate-500 transition disabled:opacity-30"
                  disabled={item.quantity <= 1}
                >
                  <Minus size={14} />
                </button>
                <span className="text-slate-900 dark:text-white font-bold w-6 text-center text-xs font-mono">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.cartItemId, 'increase')}
                  className="p-1.5 hover:text-slate-900 dark:hover:text-white text-slate-500 transition"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Thành tiền & Nút xóa */}
              <div className="flex flex-col items-center md:items-end gap-1.5 min-w-[110px]">
                <span className="text-slate-900 dark:text-white font-black text-base sm:text-lg font-mono">
                  {formatCurrency(
                    (item.selectedVariant?.price || item.price) * item.quantity,
                  )}
                </span>
                <button
                  onClick={() => removeFromCart(item.cartItemId)}
                  className="text-rose-500 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Trash2 size={13} /> Xóa
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={clearCart}
              className="text-slate-400 hover:text-rose-500 text-xs font-semibold transition"
            >
              Xóa tất cả sản phẩm trong giỏ
            </button>
            <Link
              to="/"
              className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold"
            >
              &larr; {t('continueShopping')}
            </Link>
          </div>
        </div>

        {/* --- CỘT PHẢI: TỔNG KẾT --- */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#0e1626]/90 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sticky top-24 shadow-xl space-y-5">
            <h3 className="text-lg font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">
              {t('orderSummary')}
            </h3>

            <div className="space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>{t('subtotalCol')}:</span>
                <span className="text-slate-900 dark:text-white font-mono font-bold">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Giảm giá:</span>
                <span className="text-emerald-500 font-mono font-bold">-0₫</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-4 border-t border-slate-100 dark:border-white/5">
              <span className="text-slate-900 dark:text-white font-extrabold text-sm">
                {t('totalPayment')}:
              </span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <Link
              to="/checkout"
              className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-neon-blue shadow-md transition text-center text-sm active:scale-95 uppercase tracking-wider"
            >
              {t('proceedCheckout')}
            </Link>

            <div className="flex items-start gap-3 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-3.5 rounded-2xl leading-relaxed">
              <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <p>
                {t('genuineLicense')}. Đơn hàng được bảo hành 1 đổi 1 suốt thời gian sử dụng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
