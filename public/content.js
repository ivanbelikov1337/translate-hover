
(function() {
  'use strict';

  let isEnabled = true;
  let targetLang = 'uk';
  let isTranslating = false;

  chrome.storage.sync.get(['enabled', 'targetLang'], (result) => {
    isEnabled = result.enabled !== false;
    targetLang = result.targetLang || 'uk';
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
      pointer-events: none !important;
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
    const el = document.getElementById('hover-translate-tooltip');
    if (el) el.remove();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function translateText(text) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
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

  document.addEventListener('mouseup', async (e) => {
    if (!isEnabled) return;
    
    const tooltipEl = document.getElementById('hover-translate-tooltip');
    if (tooltipEl && tooltipEl.contains(e.target)) return;
    
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';
    
    if (!selectedText || selectedText.length < 2) return;
    if (isTranslating) return;
    
    isTranslating = true;
    
    showTooltip('⏳ Перекладаю...', e.clientX, e.clientY);
    
    const translation = await translateText(selectedText);
    
    if (translation && translation.toLowerCase() !== selectedText.toLowerCase()) {
      showTooltip(`
        <div style="font-size:12px;opacity:0.85;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.2);">${escapeHtml(selectedText)}</div>
        <div style="font-size:15px;font-weight:600;">${escapeHtml(translation)}</div>
      `, e.clientX, e.clientY);
    } else {
      hideTooltip();
    }
    
    isTranslating = false;
  });

  document.addEventListener('scroll', () => hideTooltip(), true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideTooltip();
      window.getSelection().removeAllRanges();
    }
  });

})();
