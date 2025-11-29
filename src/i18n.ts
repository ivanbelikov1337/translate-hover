import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import uk from './locales/uk.json'
import en from './locales/en.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import es from './locales/es.json'
import it from './locales/it.json'
import pl from './locales/pl.json'
import ja from './locales/ja.json'
import zh from './locales/zh.json'
import ko from './locales/ko.json'

const resources = {
  uk: { translation: uk },
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  it: { translation: it },
  pl: { translation: pl },
  ja: { translation: ja },
  zh: { translation: zh },
  ko: { translation: ko }
}

const supportedLanguages = ['uk', 'en', 'de', 'fr', 'es', 'it', 'pl', 'ja', 'zh', 'ko']

const getBrowserLanguage = (): string => {
  const browserLang = navigator.language.split('-')[0]
  return supportedLanguages.includes(browserLang) ? browserLang : 'en'
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getBrowserLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
