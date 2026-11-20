import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Sparkles } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useLanguageStore from '../store/useLanguageStore';
import axiosClient from '../store/axiosClient';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    amount,
  );

const ProductCard = ({ product }) => {
  const addToCart = useCartStore((state) => state.addToCart);
  const user = useAuthStore((state) => state.user);
  const { t, translateCategory, translateProductName, formatPrice } = useLanguageStore();

  const getDiscountPercent = (variant) => {
    if (variant && parseFloat(variant.orginalPrice) > parseFloat(variant.price)) {
      return Math.round(
        ((parseFloat(variant.orginalPrice) - parseFloat(variant.price)) /
          parseFloat(variant.orginalPrice)) *
          100,
      );
    }
    return 0;
  };

  const minVariant =
    product.variants?.length > 0
      ? product.variants.reduce((bestVariant, currentVariant) => {
          const bestDiscount = getDiscountPercent(bestVariant);
          const currentDiscount = getDiscountPercent(currentVariant);

          if (currentDiscount > bestDiscount) {
            return currentVariant;
          }
          if (currentDiscount === bestDiscount) {
            return parseFloat(currentVariant.price) < parseFloat(bestVariant.price)
              ? currentVariant
              : bestVariant;
          }
          return bestVariant;
        }, product.variants[0])
      : { price: 0, orginalPrice: 0 };

  const discountPercent = getDiscountPercent(minVariant);

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, minVariant);

    if (user?.id) {
      axiosClient
        .post('/interactions/log', {
          userId: user.id,
          productId: product.id,
          type: 'ADD_TO_CART',
        })
        .catch((err) => console.error('Log Card AddToCart Error:', err));
    }
  };

  return (
    <Link to={`/product/${product.slug}`} className="group block h-full">
      {/* Container Thẻ Glassmorphism */}
      <div className="rounded-2xl h-full flex flex-col justify-between transition-all duration-300 border border-slate-200 dark:border-white/10 dark:bg-[#111827]/75 bg-white backdrop-blur-md hover:border-blue-500/80 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/10 overflow-hidden relative shadow-sm">
        
        {/* Phần Thân Header Thẻ */}
        <div className="relative overflow-hidden p-4">
          {product.thumbnail && (
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center blur-2xl scale-150 opacity-20 dark:opacity-30 transition-opacity duration-500 group-hover:opacity-40"
              style={{ backgroundImage: `url(${product.thumbnail})` }}
            ></div>
          )}

          <div className="flex gap-3.5 relative z-10">
            {/* Ảnh Icon Sản Phẩm */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl relative border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:bg-slate-900 bg-slate-100 flex items-center justify-center">
              {product.thumbnail ? (
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  className="w-full h-full object-contain p-1.5 transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <span className="text-2xl">📦</span>
              )}
            </div>

            {/* Tên & Tag Danh Mục */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <span className="inline-block self-start px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider mb-1.5 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 bg-blue-50 text-blue-600 border border-blue-200">
                {translateCategory(product.category)}
              </span>
              <h3
                className="text-slate-900 dark:text-white font-bold text-sm sm:text-base leading-snug truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                title={translateProductName(product.name)}
              >
                {translateProductName(product.name)}
              </h3>
            </div>
          </div>
        </div>

        {/* --- FOOTER GIÁ & NÚT THAO TÁC --- */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-white/5 relative z-10 dark:bg-[#0d1424]/80 bg-slate-50/80 backdrop-blur-sm">
          {/* Badge Khuyến Mãi / Tag */}
          <div className="flex items-center gap-1.5">
            {discountPercent > 0 ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                -{discountPercent}%
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <Sparkles size={10} /> {t('inStock')}
              </span>
            )}
          </div>

          {/* Giá & Nút Thêm Giỏ Hàng */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              {parseFloat(minVariant.orginalPrice) > parseFloat(minVariant.price) && (
                <div className="text-[10px] text-slate-400 line-through font-mono">
                  {formatPrice(minVariant.orginalPrice)}
                </div>
              )}
              <div className="text-slate-900 dark:text-white font-mono font-bold text-sm sm:text-base leading-none">
                {formatPrice(minVariant.price)}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-white hover:bg-blue-600 hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:border-blue-600 dark:bg-slate-800 bg-white transition-all active:scale-95 shadow-sm"
              title={t('addToCart')}
            >
              <ShoppingCart size={15} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
