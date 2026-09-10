import { useTranslation as useTranslationOriginal } from 'react-i18next';

/**
 * Custom hook for translation that provides additional utilities
 * @returns {{t: Function, i18n: Object, changeLanguage: Function, currentLanguage: string}}
 */
export function useTranslation() {
  const { t, i18n } = useTranslationOriginal();

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('preferredLanguage', languageCode);
  };

  const currentLanguage = i18n.language;

  return {
    t,
    i18n,
    changeLanguage,
    currentLanguage
  };
}