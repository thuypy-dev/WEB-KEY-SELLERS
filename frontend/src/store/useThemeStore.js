import { create } from 'zustand';

const getInitialTheme = () => {
  const saved = localStorage.getItem('vtv_theme');
  if (saved === 'dark' || saved === 'light') return saved;
  // Mặc định dark mode theo phong cách của platform
  return 'dark';
};

const applyThemeToDOM = (theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

// Khởi chạy ngay khi load module
applyThemeToDOM(getInitialTheme());

const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('vtv_theme', nextTheme);
    applyThemeToDOM(nextTheme);
    set({ theme: nextTheme });
  },
  setTheme: (theme) => {
    localStorage.setItem('vtv_theme', theme);
    applyThemeToDOM(theme);
    set({ theme });
  },
}));

export default useThemeStore;
