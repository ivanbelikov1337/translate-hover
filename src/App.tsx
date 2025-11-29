import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from './store'
import './i18n'
import './App.css'

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

function App() {
  const { t, i18n } = useTranslation()
  const { enabled, targetLang, isLoading, setEnabled, setTargetLang, loadSettings } = useSettingsStore()
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings().then(() => {
      const lang = useSettingsStore.getState().targetLang
      i18n.changeLanguage(lang)
    })
  }, [i18n, loadSettings])

  const handleToggle = () => {
    setEnabled(!enabled)
    setSaved(true)
    setTimeout(() => setSaved(false), 1000)
  }

  const handleLanguageChange = (lang: string) => {
    setTargetLang(lang)
    i18n.changeLanguage(lang)
    setSaved(true)
    setTimeout(() => setSaved(false), 1000)
  }

  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="loading">Loading...</div>
      </div>
    )
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
            <span>{enabled ? t('enabled') : t('disabled')}</span>
            <div className={`toggle ${enabled ? 'active' : ''}`} onClick={handleToggle}>
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
