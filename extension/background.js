// 电商图片下载器 —— Service Worker
// 负责：触发 content script 收集图片 → 下载 → 打包

// 从 popup 请求收集图片
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'COLLECT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return sendResponse({ ok: false, error: 'no active tab' });
      chrome.tabs.sendMessage(tabs[0].id, { type: 'COLLECT_IMAGES' }, (resp) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ ok: true, ...resp });
        }
      });
    });
    return true; // 异步 sendResponse
  }
});

// 单张下载
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'DOWNLOAD_ONE') {
    chrome.downloads.download({
      url: msg.url,
      filename: msg.filename || msg.url.split('/').pop() || 'image',
      saveAs: false,
    });
  }
});

// 批量下载：交给 popup 用 JSZip 打包后触发
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'DOWNLOAD_ZIP') {
    chrome.downloads.download({
      url: msg.url,   // blob: URL 由 popup 生成
      filename: msg.filename,
      saveAs: false,
    });
  }
});
