// AutoTranslate Hover - Background Service Worker

// Ініціалізація налаштувань при встановленні
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    enabled: true,
    targetLang: 'uk'
  });
  console.log('AutoTranslate Hover installed!');
});

// Обробка повідомлень від popup або content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['enabled', 'targetLang'], (result) => {
      sendResponse(result);
    });
    return true; // Async response
  }
  
  if (request.action === 'setSettings') {
    chrome.storage.sync.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
