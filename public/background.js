// AutoTranslate Hover - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['enabled', 'targetLang'], (result) => {
    if (result.enabled === undefined) {
      chrome.storage.sync.set({ enabled: true });
    }
  });
});

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
