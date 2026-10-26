// 电商图片下载器 —— 内容脚本
// 注入到每个页面，负责收集所有商品图片的真实 URL

(function () {
  // 标记避免重复注入
  if (window.__ecomImgLoaderInstalled) return;
  window.__ecomImgLoaderInstalled = true;

  // 从 <picture> 里选最合适的 source（优先最大尺寸 / 原始格式）
  function resolvePictureSources(pic) {
    const urls = new Set();
    // 先尝试 <source srcset>
    pic.querySelectorAll('source[srcset]').forEach((s) => {
      const srcset = s.getAttribute('srcset');
      srcset.split(',').forEach((item) => {
        const url = item.trim().split(/\s+/)[0];
        if (url) urls.add(url);
      });
    });
    // 回退到 <img>
    const img = pic.querySelector('img');
    if (img && img.currentSrc) urls.add(img.currentSrc);
    if (img && img.src) urls.add(img.src);
    return [...urls];
  }

  // 收集所有 <img> 的真实地址
  function collectImages() {
    const urls = new Set();

    // 1. 普通 <img>
    document.querySelectorAll('img').forEach((img) => {
      const src = img.currentSrc || img.src || img.dataset.original || img.dataset.src || '';
      if (src && !src.startsWith('data:')) urls.add(src);
    });

    // 2. <picture> 里的多分辨率源
    document.querySelectorAll('picture').forEach((pic) => {
      resolvePictureSources(pic).forEach((u) => urls.add(u));
    });

    // 3. 常见电商 lazy-load 属性
    const lazyAttrs = ['data-lazy-src', 'data-src', 'data-original', 'data-img', 'data-full'];
    document.querySelectorAll(`[${lazyAttrs.join('], [')}]`).forEach((el) => {
      lazyAttrs.forEach((a) => {
        const v = el.getAttribute(a);
        if (v && v.startsWith('http')) urls.add(v);
      });
    });

    // 4. background-image（选有一定尺寸的元素）
    document.querySelectorAll('div, section, li, article').forEach((el) => {
      const bg = getComputedStyle(el).backgroundImage;
      const match = bg.match(/url\(["']?(.*?)["']?\)/);
      if (match && match[1].startsWith('http')) {
        const r = el.getBoundingClientRect();
        if (r.width > 200 && r.height > 200) urls.add(match[1]);
      }
    });

    return [...urls];
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'COLLECT_IMAGES') {
      const urls = collectImages();
      sendResponse({ urls, pageUrl: location.href, pageTitle: document.title });
    }
    return true;
  });
})();
