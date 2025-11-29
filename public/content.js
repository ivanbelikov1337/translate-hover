
(function() {
  'use strict';

  const supportedLanguages = ['uk', 'en', 'de', 'fr', 'es', 'it', 'pl', 'ja', 'zh', 'ko'];
  
  const getBrowserLanguage = () => {
    const browserLang = navigator.language.split('-')[0];
    return supportedLanguages.includes(browserLang) ? browserLang : 'en';
  };

  let isEnabled = true;
  let targetLang = getBrowserLanguage();
  let isTranslating = false;
  let lastTranslatedText = '';
  let selectionStartText = '';

  const translations = {
    uk: 'Перекладаю...',
    en: 'Translating...',
    de: 'Übersetze...',
    fr: 'Traduction...',
    es: 'Traduciendo...',
    it: 'Traduzione...',
    pl: 'Tłumaczenie...',
    ja: '翻訳中...',
    zh: '翻译中...',
    ko: '번역 중...'
  };

  const sameLanguageTexts = {
    uk: 'Мова тексту збігається з мовою перекладу',
    en: 'Source language matches target language',
    de: 'Quellsprache stimmt mit Zielsprache überein',
    fr: 'La langue source correspond à la langue cible',
    es: 'El idioma de origen coincide con el de destino',
    it: 'La lingua di origine corrisponde a quella di destinazione',
    pl: 'Język źródłowy odpowiada językowi docelowemu',
    ja: '原文と翻訳先の言語が同じです',
    zh: '源语言与目标语言相同',
    ko: '원본 언어와 대상 언어가 같습니다'
  };

  const textTooLongTexts = {
    uk: 'Текст занадто довгий (макс. 500 символів)',
    en: 'Text is too long (max 500 characters)',
    de: 'Text ist zu lang (max. 500 Zeichen)',
    fr: 'Le texte est trop long (max 500 caractères)',
    es: 'El texto es demasiado largo (máx. 500 caracteres)',
    it: 'Il testo è troppo lungo (max 500 caratteri)',
    pl: 'Tekst jest za długi (maks. 500 znaków)',
    ja: 'テキストが長すぎます（最大500文字）',
    zh: '文本太长（最多500个字符）',
    ko: '텍스트가 너무 깁니다 (최대 500자)'
  };

  const getLoadingText = () => translations[targetLang] || translations.en;
  const getSameLanguageText = () => sameLanguageTexts[targetLang] || sameLanguageTexts.en;
  const getTextTooLongText = () => textTooLongTexts[targetLang] || textTooLongTexts.en;

  chrome.storage.sync.get(['enabled', 'targetLang'], (result) => {
    isEnabled = result.enabled !== false;
    if (result.targetLang) {
      targetLang = result.targetLang;
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      isEnabled = changes.enabled.newValue;
    }
    if (changes.targetLang) {
      targetLang = changes.targetLang.newValue;
    }
  });

  function showTooltip(html, x, y) {
    let tooltip = document.getElementById('hover-translate-tooltip');
    if (tooltip) tooltip.remove();
    
    tooltip = document.createElement('div');
    tooltip.id = 'hover-translate-tooltip';
    tooltip.innerHTML = html;
    
    tooltip.style.cssText = `
      position: fixed !important;
      z-index: 2147483647 !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      padding: 12px 16px !important;
      border-radius: 12px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
      max-width: 350px !important;
      min-width: 100px !important;
      pointer-events: auto !important;
      line-height: 1.4 !important;
      left: ${x}px !important;
      top: ${y + 25}px !important;
    `;
    
    document.body.appendChild(tooltip);

    const rect = tooltip.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      tooltip.style.left = `${window.innerWidth - rect.width - 15}px`;
    }
    if (rect.bottom > window.innerHeight) {
      tooltip.style.top = `${y - rect.height - 15}px`;
    }
  }

  function hideTooltip() {
    window.speechSynthesis.cancel();
    const el = document.getElementById('hover-translate-tooltip');
    if (el) el.remove();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function detectLanguage(text) {
    const patterns = {
      'uk': /[іїєґ]/i,
      'ru': /[ёъыэ]/i,
      'ja': /[\u3040-\u309F\u30A0-\u30FF]/,
      'zh': /[\u4E00-\u9FFF]/,
      'ko': /[\uAC00-\uD7AF\u1100-\u11FF]/,
      'de': /[äöüß]/i,
      'fr': /[àâçéèêëîïôùûü]/i,
      'es': /[ñáéíóú¿¡]/i,
      'it': /[àèéìíîòóùú]/i,
      'pl': /[ąćęłńóśźż]/i,
      'pt': /[ãõç]/i
    };
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) return lang;
    }
    return 'en';
  }

  const voiceMap = {
    'en': 'Google US English',
    'de': 'Google Deutsch',
    'fr': 'Google français',
    'es': 'Google español',
    'it': 'Google italiano',
    'pl': 'Google polski',
    'ja': 'Google 日本語',
    'zh': 'Google 普通话（中国大陆）',
    'ko': 'Google 한국의',
    'ru': 'Google русский',
    'pt': 'Google português do Brasil',
    'uk': 'Google русский'
  };

  function speakText(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    
    const detectedLang = detectLanguage(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoiceName = voiceMap[detectedLang] || 'Google US English';
    const preferredVoice = voices.find(v => v.name === preferredVoiceName) 
      || voices.find(v => v.name === 'Google US English');
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }

  if (typeof window.speechSynthesis !== 'undefined') {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  async function translateText(text) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetLang}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData) {
        return data.responseData.translatedText;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  document.addEventListener('mousedown', (e) => {
    const tooltipEl = document.getElementById('hover-translate-tooltip');
    if (tooltipEl && tooltipEl.contains(e.target)) return;
    
    const selection = window.getSelection();
    selectionStartText = selection ? selection.toString().trim() : '';
    lastTranslatedText = '';
    hideTooltip();
  });

  async function handleSelection(e) {
    if (!isEnabled) return;
    
    const tooltipEl = document.getElementById('hover-translate-tooltip');
    if (tooltipEl && tooltipEl.contains(e.target)) return;
    
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';
    
    const isNewSelection = selectedText && selectedText !== selectionStartText;
    
    if (!selectedText || selectedText.length < 2 || !isNewSelection) {
      return;
    }

    if (selectedText.length > 500) {
      showTooltip(`<div style="font-size:13px;">⚠️ ${getTextTooLongText()}</div>`, e.clientX, e.clientY);
      return;
    }
    
    if (selectedText === lastTranslatedText) return;
    if (isTranslating) return;
    
    isTranslating = true;
    lastTranslatedText = selectedText;
    
    showTooltip(`⏳ ${getLoadingText()}`, e.clientX, e.clientY);
    
    const translation = await translateText(selectedText);
    
    if (translation && translation.toLowerCase() !== selectedText.toLowerCase()) {
      showTooltip(`
        <div style="font-size:12px;opacity:0.85;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span>${escapeHtml(selectedText)}</span>
          <button id="hover-translate-speak" style="background:none;border:none;cursor:pointer;padding:2px;opacity:0.8;transition:opacity 0.2s;" title="Listen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
        </div>
        <div style="font-size:15px;font-weight:600;">${escapeHtml(translation)}</div>
      `, e.clientX, e.clientY);
      
      const speakBtn = document.getElementById('hover-translate-speak');
      if (speakBtn) {
        speakBtn.addEventListener('click', (evt) => {
          evt.stopPropagation();
          speakText(selectedText);
        });
        speakBtn.addEventListener('mouseenter', () => speakBtn.style.opacity = '1');
        speakBtn.addEventListener('mouseleave', () => speakBtn.style.opacity = '0.8');
      }
    } else {
      showTooltip(`<div style="font-size:13px;">⚠️ ${getSameLanguageText()}</div>`, e.clientX, e.clientY);
    }
    
    isTranslating = false;
  }

  document.addEventListener('mouseup', handleSelection);
  document.addEventListener('dblclick', handleSelection);

  document.addEventListener('scroll', () => hideTooltip(), true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.speechSynthesis.cancel();
      hideTooltip();
      window.getSelection().removeAllRanges();
    }
  });

})();
