import { create } from 'zustand'

declare const chrome: {
  storage: {
    sync: {
      get: (keys: string[], callback: (result: Record<string, unknown>) => void) => void
      set: (items: Record<string, unknown>, callback?: () => void) => void
    }
  }
}

const supportedLanguages = ['uk', 'en', 'de', 'fr', 'es', 'it', 'pl', 'ja', 'zh', 'ko']

const getBrowserLanguage = (): string => {
  const browserLang = navigator.language.split('-')[0]
  return supportedLanguages.includes(browserLang) ? browserLang : 'en'
}

interface SettingsState {
  enabled: boolean
  targetLang: string
  isLoading: boolean
  setEnabled: (enabled: boolean) => void
  setTargetLang: (lang: string) => void
  loadSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  enabled: true,
  targetLang: getBrowserLanguage(),
  isLoading: true,

  setEnabled: (enabled: boolean) => {
    set({ enabled })
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ enabled, targetLang: get().targetLang })
    }
  },

  setTargetLang: (targetLang: string) => {
    set({ targetLang })
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ enabled: get().enabled, targetLang })
    }
  },

  loadSettings: () => {
    return new Promise<void>((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['enabled', 'targetLang'], (result) => {
          set({
            enabled: result.enabled !== false,
            targetLang: (result.targetLang as string) || getBrowserLanguage(),
            isLoading: false
          })
          resolve()
        })
      } else {
        set({ isLoading: false })
        resolve()
      }
    })
  }
}))
