import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './locales/vi/translation.json';
import en from './locales/en/translation.json';

const savedLang = localStorage.getItem('thuenha_lang') || 'vi';

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false, // React đã tự escape
  },
});

export default i18n;
