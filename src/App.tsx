import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './i18n'
import './App.css'

declare const chrome: {
  storage: {
    sync: {
      get: (keys: string[], callback: (result: Record<string, unknown>) => void) => void
      set: (items: Record<string, unknown>, callback?: () => void) => void
    }
  }
}

const languages = [
  { code: 'uk', name: 'Українська' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'pl', name: 'Polski' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'ko', name: '한국어' },
]

const supportedLanguages = languages.map(l => l.code)

const getBrowserLanguage = (): string => {
  const browserLang = navigator.language.split('-')[0]
  return supportedLanguages.includes(browserLang) ? browserLang : 'en'
}

function App() {
  const { t, i18n } = useTranslation()
  const [enabled, setEnabled] = useState(true)
  const [targetLang, setTargetLang] = useState(getBrowserLanguage)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(['enabled', 'targetLang'], (result) => {
        setEnabled(result.enabled !== false)
        if (result.targetLang) {
          setTargetLang(result.targetLang as string)
          i18n.changeLanguage(result.targetLang as string)
        }
      })
    }
  }, [i18n])

  const saveSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ enabled, targetLang }, () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      })
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      saveSettings()
    }, 300)
    return () => clearTimeout(timer)
  }, [enabled, targetLang])

  const handleLanguageChange = (lang: string) => {
    setTargetLang(lang)
    i18n.changeLanguage(lang)
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="logo">🌐</div>
        <h1>Hover Translate</h1>
      </header>

      <main className="popup-content">
        <div className="setting-item">
          <label className="toggle-label">
            <span>{t('enabled')}</span>
            <div className={`toggle ${enabled ? 'active' : ''}`} onClick={() => setEnabled(!enabled)}>
              <div className="toggle-slider"></div>
            </div>
          </label>
        </div>

        <div className="setting-item">
          <label htmlFor="language">{t('targetLanguage')}</label>
          <select 
            id="language" 
            value={targetLang} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={!enabled}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="info-box">
          <p>{t('hint')}</p>
        </div>

        {saved && (
          <div className="saved-notification">
            {t('saved')}
          </div>
        )}
      </main>

      <footer className="popup-footer">
        <span>v1.0.0</span>
      </footer>
    </div>
  )
}

export default App
