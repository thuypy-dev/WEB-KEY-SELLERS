import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Youtube, Instagram, Sparkles } from 'lucide-react';
import useLanguageStore from '../store/useLanguageStore';

const Footer = () => {
  const { t } = useLanguageStore();

  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-white/10 dark:bg-[#070b14] bg-white pt-14 pb-8 text-sm transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 text-slate-600 dark:text-slate-400">
          {/* Cột 1 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles size={12} />
              </div>
              <h3 className="text-slate-900 dark:text-white font-bold tracking-tight uppercase text-base">
                PDT<span className="text-blue-600 dark:text-blue-400">Key</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              {t('footerDesc')}
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/about"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  {t('aboutUs')}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  {t('partnership')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 2 */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold mb-4 uppercase text-xs tracking-wider">
              {t('customerService')}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/policy/guide"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  {t('buyingGuide')}
                </Link>
              </li>
              <li>
                <Link
                  to="/policy/warranty"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  {t('warrantyPolicy')}
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  {t('faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3 */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold mb-4 uppercase text-xs tracking-wider">
              {t('policiesLegal')}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/policy/terms"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  {t('termsOfService')}
                </Link>
              </li>
              <li>
                <Link
                  to="/policy/privacy"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link
                  to="/policy/refund"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  {t('refundPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4 */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold mb-4 uppercase text-xs tracking-wider">
              {t('connectWithUs')}
            </h3>
            <p className="text-xs text-slate-500 mb-3">{t('supportHotline')}</p>
            <p className="text-base font-mono font-bold text-blue-600 dark:text-blue-400 mb-4">
              078829507
            </p>
            <div className="flex gap-2.5">
              <a
                href="#"
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition shadow-sm"
              >
                <Facebook size={16} />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-white hover:bg-rose-600 hover:border-rose-600 transition shadow-sm"
              >
                <Youtube size={16} />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-white hover:bg-pink-600 hover:border-pink-600 transition shadow-sm"
              >
                <Instagram size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs gap-3">
          <p>© 2026 PDTKey. {t('allRightsReserved')}</p>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>Powered by UI Platform v2.0 Design</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
