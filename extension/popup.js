// 电商图片下载器 —— 弹窗逻辑

let allUrls = [];
let selected = new Set();
let pageTitle = '';
let pageUrl = '';

const $ = (id) => document.getElementById(id);

function setStatus(text) {
  $('status').textContent = text;
}

function renderGrid() {
  const grid = $('grid');
  grid.innerHTML = '';
  if (allUrls.length === 0) {
    grid.innerHTML = '<div class="empty">页面上没找到商品图片 😢</div>';
    return;
  }
  allUrls.forEach((url, i) => {
    const div = document.createElement('div');
    div.className = 'thumb' + (selected.has(i) ? ' selected' : '');
    div.innerHTML = `<img src="${url}" loading="lazy" onerror="this.style.display='none'"><div class="chk">✓</div>`;
    div.addEventListener('click', () => {
      if (selected.has(i)) selected.delete(i); else selected.add(i);
      div.classList.toggle('selected');
      updateFooter();
    });
    grid.appendChild(div);
  });
}

function updateFooter() {
  $('count').textContent = `已选 ${selected.size} / 共 ${allUrls.length} 张`;
  $('downloadZipBtn').disabled = selected.size === 0;
  $('selectAllBtn').disabled = allUrls.length === 0;
  $('selectAllBtn').textContent = selected.size === allUrls.length && allUrls.length > 0 ? '取消全选' : '全选';
}

// 扫描
$('scanBtn').addEventListener('click', () => {
  setStatus('⏳ 正在扫描本页图片...');
  chrome.runtime.sendMessage({ type: 'COLLECT' }, (resp) => {
    if (!resp || !resp.ok) {
      setStatus('❌ 扫描失败：' + (resp?.error || '当前页面无法访问'));
      return;
    }
    allUrls = resp.urls;
    pageTitle = resp.pageTitle || 'images';
    pageUrl = resp.pageUrl || '';
    selected = new Set(allUrls.map((_, i) => i)); // 默认全选
    setStatus(`✅ 找到 ${allUrls.length} 张图片`);
    renderGrid();
    updateFooter();
  });
});

// 全选 / 取消全选
$('selectAllBtn').addEventListener('click', () => {
  if (selected.size === allUrls.length) selected.clear();
  else selected = new Set(allUrls.map((_, i) => i));
  renderGrid();
  updateFooter();
});

// 打包 ZIP 下载
$('downloadZipBtn').addEventListener('click', async () => {
  const idx = [...selected].sort((a, b) => a - b);
  setStatus(`⏳ 正在打包 ${idx.length} 张图片...`);
  try {
    const zip = new JSZip();
    let done = 0;
    for (const i of idx) {
      const url = allUrls[i];
      try {
        const resp = await fetch(url, { mode: 'cors' });
        const blob = await resp.blob();
        const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
        const fname = `img_${String(done + 1).padStart(3, '0')}.${ext}`;
        zip.file(fname, blob);
      } catch (e) {
        // CORS 失败时跳过（常见于防盗链页面）
        console.warn('skip', url, e);
      }
      done++;
      setStatus(`⏳ 下载中 ${done}/${idx.length}...`);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const zipName = `${(pageTitle || 'ecom').replace(/[\\/:*?"<>|]/g, '_')}_images.zip`;
    const url = URL.createObjectURL(content);
    chrome.runtime.sendMessage({ type: 'DOWNLOAD_ZIP', url, filename: zipName });
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    setStatus(`✅ 已触发下载：${zipName}`);
  } catch (e) {
    setStatus('❌ 打包失败：' + e.message);
  }
});
