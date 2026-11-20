import React from 'react';
import useLanguageStore from '../store/useLanguageStore';

// Vietnam Flag SVG (Chuẩn cờ đỏ sao vàng)
const VietnamFlag = () => (
  <svg
    className="w-4 h-3 rounded-[2px] shrink-0 shadow-xs"
    viewBox="0 0 30 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="30" height="20" fill="#DA251D" />
    <polygon
      points="15,4 16.5,8.8 21.6,8.8 17.5,11.8 19,16.5 15,13.5 11,16.5 12.5,11.8 8.4,8.8 13.5,8.8"
      fill="#FFFF00"
    />
  </svg>
);

// United Kingdom Flag SVG (Chuẩn cờ Union Jack)
const UKFlag = () => (
  <svg
    className="w-4 h-3 rounded-[2px] shrink-0 shadow-xs"
    viewBox="0 0 60 30"
    xmlns="http://www.w3.org/2000/svg"
  >
    <clipPath id="uk-clip">
      <path d="M0,0 v30 h60 v-30 z" />
    </clipPath>
    <clipPath id="uk-diag">
      <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
    </clipPath>
    <g clipPath="url(#uk-clip)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath="url(#uk-diag)"
        stroke="#C8102E"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </g>
  </svg>
);

const LanguageSwitcher = ({ className = '', variant = 'pill' }) => {
  const { language, setLanguage, toggleLanguage } = useLanguageStore();

  if (variant === 'button') {
    return (
      <button
        onClick={toggleLanguage}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-slate-800/60 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition shadow-sm active:scale-95 ${className}`}
        title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
      >
        {language === 'vi' ? <VietnamFlag /> : <UKFlag />}
        <span className="text-slate-800 dark:text-slate-200 uppercase font-mono tracking-wider">
          {language === 'vi' ? 'VN' : 'EN'}
        </span>
      </button>
    );
  }

  // Variant 'pill' (Dual switch VN | EN)
  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-slate-900/80 bg-slate-100 shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('vi')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
          language === 'vi'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Tiếng Việt"
      >
        <VietnamFlag />
        <span className="font-mono text-[11px] font-extrabold">VN</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
          language === 'en'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="English"
      >
        <UKFlag />
        <span className="font-mono text-[11px] font-extrabold">EN</span>
      </button>
    </div>
  );
};

export default LanguageSwitcher;
