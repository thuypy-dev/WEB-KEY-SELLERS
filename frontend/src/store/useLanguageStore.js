import { create } from 'zustand';
import { translations } from './translations';

const getInitialLanguage = () => {
  const saved = localStorage.getItem('pdt_language');
  if (saved === 'vi' || saved === 'en') return saved;
  // Mặc định Tiếng Việt
  return 'vi';
};

const useLanguageStore = create((set, get) => ({
  language: getInitialLanguage(),

  setLanguage: (lang) => {
    if (lang === 'vi' || lang === 'en') {
      localStorage.setItem('pdt_language', lang);
      set({ language: lang });
    }
  },

  toggleLanguage: () => {
    const nextLang = get().language === 'vi' ? 'en' : 'vi';
    localStorage.setItem('pdt_language', nextLang);
    set({ language: nextLang });
  },

  t: (key, fallback = '') => {
    const lang = get().language;
    return (
      translations[lang]?.[key] ??
      translations['vi']?.[key] ??
      fallback ??
      key
    );
  },

  translateCategory: (category) => {
    if (!category) return get().t('digitalLicense');
    const slug = typeof category === 'string' ? category : category?.slug;
    const rawName = typeof category === 'string' ? category : category?.name;
    if (slug) {
      const key = `cat_${slug}`;
      const translated = get().t(key);
      if (translated && translated !== key) return translated;
    }
    return rawName || get().t('digitalLicense');
  },

  translateProductName: (name) => {
    if (!name || get().language !== 'en') return name;
    return name
      .replace(/\(Vĩnh Viễn\)/gi, '(Lifetime)')
      .replace(/\(Toàn diện\)/gi, '(All-in-One)')
      .replace(/\(Bản Quyền\)/gi, '(Official License)')
      .replace(/\(Chính Hãng\)/gi, '(Genuine)')
      .replace(/\(1 Năm\)/gi, '(1 Year)')
      .replace(/\(Thẻ 1 Năm\)/gi, '(1 Year Card)')
      .replace(/\(Tháng\)/gi, '(Monthly)')
      .replace(/\(Gia Hạn\)/gi, '(Renewal)')
      .replace(/Key 1 Năm/gi, '1 Year Key')
      .replace(/Key Vĩnh Viễn/gi, 'Lifetime Key')
      .replace(/Tài Khoản/gi, 'Account')
      .replace(/Gói/gi, 'Package');
  },

  formatPrice: (amount) => {
    const lang = get().language;
    if (lang === 'en') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  },
}));

export default useLanguageStore;
