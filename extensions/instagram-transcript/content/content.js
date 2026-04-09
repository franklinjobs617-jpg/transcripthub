// Content Script - 注入到Instagram页面，调用API - 异步轮询版本
(function () {
  'use strict';

  let fabButton = null;
  let toastElement = null;

  const API_BASE = 'https://transcripthub.net';

  const KIE_POLL_MAX_ROUNDS = 30;
  const KIE_POLL_INTERVAL_MS = 3000;

  // 检测当前页面URL是否是Instagram视频/Reels
  function isInstagramVideo() {
    const url = window.location.href;
    return url.includes('/reel/') ||
      url.includes('/reels/') ||
      url.includes('/v/') ||
      url.includes('/tv/');
  }

  // 获取当前视频URL
  function getCurrentVideoUrl() {
    if (!isInstagramVideo()) return null;
    return window.location.href.split('?')[0];
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 1. 发起任务获取 Direct Link (包含 task_id)
  async function fetchDirectLink(url) {
    const response = await fetch(`${API_BASE}/api/instagram/transcript/direct-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Request failed: ${response.status}`);
    }
    return response.json();
  }

  // 2. 核心获取逻辑 - 异步轮询
  async function getTranscriptsWorkflow(videoUrl) {
    let payload = await fetchDirectLink(videoUrl);

    // 如果直接拿到了结果
    if (payload.kie?.state === 'success' && payload.kie?.transcript_text) {
      return payload;
    }

    // 开始轮询 - 直接调用同一个接口
    for (let round = 0; round < KIE_POLL_MAX_ROUNDS; round++) {
      await sleep(KIE_POLL_INTERVAL_MS);

      // 重复调用 direct-link 获取最新状态
      const latestPayload = await fetchDirectLink(videoUrl);
      const kie = latestPayload.kie;

      if (kie?.state === 'success') {
        return latestPayload;
      }

      if (kie?.state === 'fail') {
        throw new Error(kie.error?.message || "Transcription task failed.");
      }
    }

    throw new Error("Transcription timed out. Please try refreshing or visit the website.");
  }

  // 增加使用次数
  async function incrementUsage() {
    await chrome.runtime.sendMessage({ action: 'incrementUsage' });
  }

  // 检查配额
  async function checkQuota() {
    return chrome.runtime.sendMessage({ action: 'checkQuota' });
  }

  // 创建悬浮按钮
  function createFAB() {
    if (fabButton) return;

    fabButton = document.createElement('button');
    fabButton.className = 'transcript-fab';
    fabButton.title = 'Generate Transcript';
    fabButton.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2l-1.5 1.5zm-.5 15c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1zm0-3H8V7h11v8.5z"/>
      </svg>
    `;

    fabButton.addEventListener('click', handleFABClick);
    document.body.appendChild(fabButton);
  }

  // 显示结果 Toast
  function showToast(payload) {
    if (toastElement) {
      toastElement.remove();
    }

    toastElement = document.createElement('div');
    toastElement.className = 'transcript-toast';

    const fullText = payload.kie?.transcript_text || "";
    const preview = fullText.substring(0, 150).trim();
    const hasMore = fullText.length > 150;

    toastElement.innerHTML = `
      <button class="transcript-toast-close">
        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
      <div class="transcript-toast-header">
        <div class="transcript-toast-icon">
          <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>
        <h4 class="transcript-toast-title">Transcript Ready!</h4>
      </div>
      <div class="transcript-toast-content">
        <p class="transcript-toast-preview">${preview}${hasMore ? '...' : ''}</p>
      </div>
      <div class="transcript-toast-actions">
        <button class="transcript-toast-btn secondary" id="toast-copy">Copy Text</button>
        <button class="transcript-toast-btn primary" id="toast-more">Full Details</button>
      </div>
    `;

    document.body.appendChild(toastElement);

    // 绑定事件
    toastElement.querySelector('.transcript-toast-close').addEventListener('click', () => {
      toastElement.remove();
      toastElement = null;
    });

    toastElement.querySelector('#toast-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(fullText);
      const btn = toastElement.querySelector('#toast-copy');
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    });

    toastElement.querySelector('#toast-more').addEventListener('click', () => {
      chrome.runtime.sendMessage({
        action: 'openWebsite',
        url: getCurrentVideoUrl()
      });
    });
  }

  // 处理按钮点击
  async function handleFABClick() {
    const videoUrl = getCurrentVideoUrl();
    if (!videoUrl) return;

    // 先检查配额
    const quota = await checkQuota();
    if (!quota.canUse) {
      // 配额用完，跳转网站
      chrome.runtime.sendMessage({ action: 'openWebsite', url: videoUrl });
      return;
    }

    fabButton.classList.add('loading');

    try {
      // 使用轮询流程获取结果
      const result = await getTranscriptsWorkflow(videoUrl);

      // 增加使用次数
      await incrementUsage();

      showToast(result);
    } catch (error) {
      console.error('Transcript extension error:', error);

      // 如果是配额/登录错误，跳转到网站
      if (error.message.includes('LOGIN_REQUIRED') ||
        error.message.includes('credits') ||
        error.message.includes('402')) {
        chrome.runtime.sendMessage({ action: 'openWebsite', url: videoUrl });
      } else {
        alert('Transcription Error: ' + error.message);
      }
    } finally {
      fabButton.classList.remove('loading');
    }
  }

  // 页面加载时检查
  function init() {
    if (isInstagramVideo()) {
      createFAB();
    }
  }

  // 监听URL变化（Instagram是单页应用）
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      if (isInstagramVideo()) {
        createFAB();
      } else if (fabButton) {
        fabButton.remove();
        fabButton = null;
      }
    }
  }).observe(document, { subtree: true, childList: true });

  // 等待DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
