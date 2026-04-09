// Popup Script - 全流程异步化版本
const API_BASE = 'https://transcripthub.net';

document.addEventListener('DOMContentLoaded', async () => {
  const currentPageSection = document.getElementById('current-page-section');
  const noVideoSection = document.getElementById('no-video-section');
  const resultSection = document.getElementById('result-section');
  const generateBtn = document.getElementById('generate-btn');
  const btnText = document.getElementById('btn-text');
  const copyBtn = document.getElementById('copy-btn');
  const copyText = document.getElementById('copy-text');
  const visitSiteBtn = document.getElementById('visit-site-btn');
  const videoUrlEl = document.getElementById('video-url');
  const resultContent = document.getElementById('result-content');

  let currentVideoUrl = null;
  let lastTranscriptText = "";

  // 检查当前tab
  async function checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && (tab.url.includes('instagram.com/reel/') ||
        tab.url.includes('instagram.com/reels/') ||
        tab.url.includes('instagram.com/v/') ||
        tab.url.includes('instagram.com/tv/'))) {
        currentVideoUrl = tab.url.split('?')[0];
        currentPageSection.style.display = 'block';
        noVideoSection.style.display = 'none';
        videoUrlEl.textContent = currentVideoUrl;
      } else {
        currentPageSection.style.display = 'none';
        noVideoSection.style.display = 'block';
      }
    } catch (error) {
      currentPageSection.style.display = 'none';
      noVideoSection.style.display = 'block';
    }
  }

  // 通用Fetch封装
  async function callApi(endpoint, method = 'POST', body = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `API Error: ${response.status}`);
    }
    return data;
  }

  // 轮询逻辑 - 改为调用 direct-link
  async function pollTaskStatus(videoUrl, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const data = await callApi('/api/instagram/transcript/direct-link', 'POST', { url: videoUrl }).catch(() => null);

      if (!data || !data.kie) continue;

      if (data.kie.state === 'success') {
        return data.kie;
      }
      if (data.kie.state === 'fail') {
        throw new Error(data.kie.error?.message || "Transcription failed.");
      }
    }
    throw new Error('Transcription timeout.');
  }

  // 生成转录
  async function generateTranscript() {
    if (!currentVideoUrl) return;

    generateBtn.disabled = true;
    generateBtn.classList.add('loading');
    btnText.textContent = 'Analyzing...';
    resultSection.style.display = 'none';

    try {
      // 1. 发起请求获取任务
      const directData = await callApi('/api/instagram/transcript/direct-link', 'POST', { url: currentVideoUrl });

      let finalKie = directData.kie;

      // 2. 如果没拿结果，则轮询
      if (finalKie?.state !== 'success') {
        btnText.textContent = 'Transcribing...';
        finalKie = await pollTaskStatus(currentVideoUrl);
      }

      lastTranscriptText = finalKie?.transcript_text || "";

      // 显示结果 (即使为空也显示成功状态，避免报错)
      resultContent.textContent = lastTranscriptText || "(No speech detected in this video)";
      resultSection.style.display = 'flex';

      generateBtn.classList.remove('loading');
      generateBtn.classList.add('success');
      btnText.textContent = 'Finished!';

      await chrome.runtime.sendMessage({ action: 'incrementUsage' });

      setTimeout(() => {
        generateBtn.disabled = false;
        generateBtn.classList.remove('success');
        btnText.textContent = 'Generate Transcript';
      }, 3000);

    } catch (error) {
      console.error('Popup error:', error);
      btnText.textContent = 'Opening website...';

      // 遇到严重错误（配额、登录、超时）自动引流到网站
      setTimeout(async () => {
        await chrome.runtime.sendMessage({ action: 'openWebsite', url: currentVideoUrl });
        window.close();
      }, 1500);
    }
  }

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(lastTranscriptText);
    copyText.textContent = 'Copied!';
    setTimeout(() => { copyText.textContent = 'Copy'; }, 2000);
  });

  visitSiteBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openWebsite', url: currentVideoUrl || '' });
    window.close();
  });

  generateBtn.addEventListener('click', generateTranscript);
  await checkCurrentTab();
});
