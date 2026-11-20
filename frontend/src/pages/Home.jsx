import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Gamepad2,
  Bot,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Palette,
  GraduationCap,
  AppWindow,
  Film,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// --- IMPORT COMPONENT ---
import ProductCard from '../components/ProductCard';
import Banner from '../components/Banner';
import HotTrend from '../components/HotTrend';
import axiosClient from '../store/axiosClient';
import useAuthStore from '../store/useAuthStore';
import useLanguageStore from '../store/useLanguageStore';

// --- CẤU HÌNH DANH MỤC ---
const CATEGORIES = [
  {
    id: 'hot',
    title: 'SẢN PHẨM HOT TREND',
    icon: <Zap size={20} className="text-amber-500 dark:text-yellow-400" />,
  },
  {
    id: 'ai',
    title: 'TRÍ TUỆ NHÂN TẠO (AI)',
    icon: <Bot size={20} className="text-emerald-500 dark:text-emerald-400" />,
  },
  {
    id: 'entertainment',
    title: 'GIẢI TRÍ & PHIM ẢNH',
    icon: <Film size={20} className="text-rose-500 dark:text-rose-400" />,
  },
  {
    id: 'game',
    title: 'GAME BẢN QUYỀN',
    icon: <Gamepad2 size={20} className="text-blue-500 dark:text-blue-400" />,
  },
  {
    id: 'software',
    title: 'PHẦN MỀM & WINDOWS',
    icon: <AppWindow size={20} className="text-purple-500 dark:text-purple-400" />,
  },
  {
    id: 'education',
    title: 'HỌC TẬP & VPN',
    icon: <GraduationCap size={20} className="text-indigo-500 dark:text-indigo-400" />,
  },
  {
    id: 'design',
    title: 'DESIGN & ĐỒ HỌA',
    icon: <Palette size={20} className="text-pink-500 dark:text-pink-400" />,
  },
  {
    id: 'security',
    title: 'DIỆT VIRUS & BẢO MẬT',
    icon: <ShieldCheck size={20} className="text-cyan-500 dark:text-cyan-400" />,
  },
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const { t } = useLanguageStore();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get('/products', {
          params: { limit: 100 },
        });
        let productList = [];
        if (res && Array.isArray(res.product)) {
          productList = res.product;
        } else if (Array.isArray(res)) {
          productList = res;
        }
        setProducts(productList);
      } catch (error) {
        console.error('Lỗi tải trang chủ:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchRecommendations = async () => {
        try {
          const res = await axiosClient.get('/products/recommendations');
          if (Array.isArray(res) && res.length > 0) {
            setRecommendedProducts(res);
          }
        } catch (error) {
          console.error('Lỗi lấy gợi ý:', error);
        }
      };
      fetchRecommendations();
    }
  }, [isAuthenticated]);

  return (
    <div className="pb-20 min-h-screen">
      <Banner />

      <div className="container mx-auto px-4 space-y-12 mt-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-500 font-mono text-sm">{t('loadingAssets')}</p>
          </div>
        ) : (
          <>
            {/* HOT TREND SLIDER */}
            <HotTrend products={products} />

            {/* GỢI Ý RIÊNG (Dành cho thành viên) */}
            {recommendedProducts.length > 0 && (
              <section className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-indigo-950/40 border border-amber-500/30 p-6 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-xl shadow-amber-900/10 relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="flex items-center justify-between mb-6 border-b border-amber-500/20 pb-3 relative z-10">
                  <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2.5 text-slate-900 dark:text-white uppercase tracking-tight">
                    <Sparkles size={22} className="text-amber-400 animate-pulse" />
                    {t('youMayLike')}
                  </h2>
                  <span className="text-xs font-mono font-medium text-amber-600 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-500/30">
                    {t('forYouOnly')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 relative z-10">
                  {recommendedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* DANH SÁCH CÁC MỤC SẢN PHẨM */}
            {CATEGORIES.map((cat) => {
              const filteredProducts = products.filter((p) => {
                if (cat.id === 'hot') return p.isHot === true;
                const categorySlug = p.category?.slug || '';
                return categorySlug === cat.id;
              });

              if (filteredProducts.length === 0) return null;

              return (
                <section
                  key={cat.id}
                  className="rounded-3xl p-6 border border-slate-200 dark:border-white/10 dark:bg-[#111827]/70 bg-white backdrop-blur-md shadow-sm transition-colors duration-200"
                >
                  <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-white/5 pb-3">
                    <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2.5 text-slate-900 dark:text-white uppercase tracking-tight">
                      {cat.icon}
                      <span>{t('cat_' + cat.id, cat.title)}</span>
                    </h2>
                    <Link
                      to={cat.id === 'hot' ? '/products' : `/category/${cat.id}`}
                      className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition flex items-center gap-1 group"
                    >
                      <span>{t('viewAll')}</span>
                      <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredProducts.slice(0, 7).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}

                    {/* Card "Xem thêm" */}
                    <Link
                      to={cat.id === 'hot' ? '/products' : `/category/${cat.id}`}
                      className="group h-full block"
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="dark:bg-[#0b101d] bg-slate-50 h-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition-all flex flex-row items-center justify-center gap-3 p-5 cursor-pointer relative overflow-hidden"
                      >
                        <div className="w-11 h-11 rounded-xl dark:bg-slate-800 bg-white flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                          <ArrowRight
                            size={20}
                            className="group-hover:translate-x-1 transition-transform"
                          />
                        </div>
                        <div className="text-left">
                          <span className="text-slate-900 dark:text-white font-bold text-sm block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {t('viewAllUpper')}
                          </span>
                          <span className="text-slate-400 text-xs font-mono">
                            {t('exploreMore')}
                          </span>
                        </div>
                      </motion.div>
                    </Link>
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
