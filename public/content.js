
(function() {
  'use strict';

  let isEnabled = true;
  let targetLang = 'uk';
  let isTranslating = false;

  console.log('[HoverTranslate] Script loaded');

  chrome.storage.sync.get(['enabled', 'targetLang'], (result) => {
    isEnabled = result.enabled !== false;
    targetLang = result.targetLang || 'uk';
    console.log('[HoverTranslate] Settings:', { isEnabled, targetLang });
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
    // Видаляємо старий
    let tooltip = document.getElementById('hover-translate-tooltip');
    if (tooltip) tooltip.remove();
    
    // Створюємо новий
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
      pointer-events: none !important;
      line-height: 1.4 !important;
      left: ${x}px !important;
      top: ${y + 25}px !important;
    `;
    
    document.body.appendChild(tooltip);
    console.log('[HoverTranslate] Tooltip shown:', html.substring(0, 50));

    // Коригуємо позицію
    const rect = tooltip.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      tooltip.style.left = `${window.innerWidth - rect.width - 15}px`;
    }
    if (rect.bottom > window.innerHeight) {
      tooltip.style.top = `${y - rect.height - 15}px`;
    }
  }

  function hideTooltip() {
    const el = document.getElementById('hover-translate-tooltip');
    if (el) {
      el.remove();
      console.log('[HoverTranslate] Tooltip hidden');
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function translateText(text) {
    console.log('[HoverTranslate] Translating:', text);
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log('[HoverTranslate] API response:', data);
      
      if (data.responseStatus === 200 && data.responseData) {
        return data.responseData.translatedText;
      }
      return null;
    } catch (error) {
      console.error('[HoverTranslate] Translation error:', error);
      return null;
    }
  }

  // Виділення тексту
  document.addEventListener('mouseup', async (e) => {
    console.log('[HoverTranslate] mouseup event');
    
    if (!isEnabled) {
      console.log('[HoverTranslate] Disabled');
      return;
    }
    
    // Ігноруємо клік на tooltip
    const tooltipEl = document.getElementById('hover-translate-tooltip');
    if (tooltipEl && tooltipEl.contains(e.target)) {
      console.log('[HoverTranslate] Click on tooltip, ignoring');
      return;
    }
    
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';
    console.log('[HoverTranslate] Selected text:', selectedText);
    
    if (!selectedText || selectedText.length < 2) {
      console.log('[HoverTranslate] No selection or too short');
      return;
    }
    
    if (isTranslating) {
      console.log('[HoverTranslate] Already translating');
      return;
    }
    
    isTranslating = true;
    
    // Показуємо завантаження
    showTooltip('⏳ Перекладаю...', e.clientX, e.clientY);
    
    const translation = await translateText(selectedText);
    console.log('[HoverTranslate] Translation result:', translation);
    
    if (translation && translation.toLowerCase() !== selectedText.toLowerCase()) {
      showTooltip(`
        <div style="font-size:12px;opacity:0.85;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.2);">${escapeHtml(selectedText)}</div>
        <div style="font-size:15px;font-weight:600;">${escapeHtml(translation)}</div>
      `, e.clientX, e.clientY);
      console.log('[HoverTranslate] Final tooltip shown');
    } else {
      hideTooltip();
      console.log('[HoverTranslate] No translation or same text');
    }
    
    isTranslating = false;
  });

  // Сховати при скролі
  document.addEventListener('scroll', () => {
    hideTooltip();
  }, true);

  // Сховати при Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideTooltip();
      window.getSelection().removeAllRanges();
    }
  });

})();
