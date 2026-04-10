document.addEventListener('DOMContentLoaded', async () => {
  // UI Elements
  const loadingOverlay = document.getElementById('loading-overlay');
  const loaderText = document.getElementById('loader-text');
  const mainView = document.getElementById('main-view');
  const noVideoView = document.getElementById('no-video-view');

  const thumbImg = document.getElementById('video-thumbnail');
  const titleEl = document.getElementById('video-title');
  const langSelect = document.getElementById('lang-select');
  const resultContent = document.getElementById('result-content');

  const copyBtn = document.getElementById('copy-btn');
  const srtBtn = document.getElementById('download-srt-btn');
  const closeBtn = document.getElementById('close-btn');

  // API Configuration
  const API_BASE = 'https://transcripthub.net';
  let currentVideoUrl = '';

  // Close logic
  closeBtn.addEventListener('click', () => window.close());

  // 1. Initial URL Check
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url && (tab.url.includes('facebook.com/reels/') || tab.url.includes('facebook.com/watch/') || tab.url.includes('facebook.com/reel/') || tab.url.includes('fb.watch/'))) {
    currentVideoUrl = tab.url.split('?')[0];
    startWorkflow();
  } else {
    loadingOverlay.classList.add('hidden');
    noVideoView.classList.remove('hidden');
  }

  // 2. Main Workflow
  async function startWorkflow() {
    try {
      // Step A: Load Info (Always show loading until data is FULLY ready)
      loaderText.textContent = 'Analyzing video...';
      const infoData = await callApi('/api/facebook/transcript/info', 'POST', { url: currentVideoUrl });

      if (infoData.ok) {
        thumbImg.src = infoData.video?.thumbnail || '';
        titleEl.textContent = infoData.video?.title || 'Facebook Video';
        if (infoData.subtitle?.languages?.length) {
          langSelect.innerHTML = infoData.subtitle.languages.map(l =>
            `<option value="${l.code}">${l.label} (${l.source === 'automatic' ? 'ASR' : 'Manual'})</option>`
          ).join('');
        }
      }

      // Step B: Get Content (Check ASR subtitles first)
      if (infoData.subtitle?.available) {
        loaderText.textContent = 'Extracting subtitles...';
        const contentData = await callApi('/api/facebook/transcript/content', 'POST', {
          url: currentVideoUrl,
          lang: langSelect.value
        });
        if (contentData.ok) {
          renderSegments(contentData.content?.segments);
          showContent();
          return;
        }
      }

      // Step C: If no ASR, execute AI
      loaderText.textContent = 'AI Transcribing (may take ~15s)...';
      const directData = await callApi('/api/facebook/transcript/direct-link', 'POST', { url: currentVideoUrl });

      let finalKie = directData.kie;
      if (finalKie?.state !== 'success' && finalKie?.task_id) {
        finalKie = await pollTaskStatus(finalKie.task_id);
      }

      renderSegments(finalKie.segments || [{ start: 0, text: finalKie.transcript_text }]);
      showContent();

    } catch (err) {
      console.error(err);
      if (err.message.includes('Free guest limit') || err.message.includes('LOGIN_REQUIRED')) {
        chrome.tabs.create({ url: 'https://transcripthub.net/login' });
        window.close();
        return;
      }
      loadingOverlay.classList.add('hidden');
      mainView.classList.remove('hidden');
      resultContent.innerHTML = `<p style="color:red; padding:20px;">Error: ${err.message}</p>`;
    }
  }

  function showContent() {
    loadingOverlay.classList.add('hidden');
    mainView.classList.remove('hidden');
  }

  // Helper: API Caller
  async function callApi(path, method = 'GET', body = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error?.message || data.error?.code || `API Error: ${response.status}`);
    }
    return data;
  }

  // Helper: Polling
  async function pollTaskStatus(taskId) {
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 1500));
      loaderText.textContent = `Processing AI... (${i + 1}s)`;
      const data = await callApi(`/api/facebook/transcript/task-status?task_id=${taskId}`).catch(() => null);
      if (data?.kie?.state === 'success') return data.kie;
      if (data?.kie?.state === 'fail') throw new Error(data.kie.error?.message || "Failed");
    }
    throw new Error('Timeout');
  }

  // Helper: Rendering
  function renderSegments(segments) {
    if (!segments || !segments.length) {
      resultContent.innerHTML = '<p style="padding:20px;">No transcript available.</p>';
      return;
    }

    resultContent.innerHTML = segments.map(seg => `
        <div class="segment-row">
            <span class="timestamp">${formatTime(seg.start)}</span>
            <span class="segment-text">${seg.text}</span>
        </div>
    `).join('');
  }

  function formatTime(sec) {
    const s = Math.floor(sec || 0);
    const m = Math.floor(s / 60);
    const ss = (s % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
  }

  // Actions
  copyBtn.addEventListener('click', () => {
    const text = Array.from(document.querySelectorAll('.segment-text')).map(s => s.textContent).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.innerText = 'Copied!';
      setTimeout(() => { copyBtn.innerText = 'Copy'; }, 2000);
    });
  });

  srtBtn.addEventListener('click', () => {
    const rows = document.querySelectorAll('.segment-row');
    let srt = '';
    rows.forEach((row, i) => {
      const t = row.querySelector('.timestamp').textContent;
      const txt = row.querySelector('.segment-text').textContent;
      srt += `${i + 1}\n00:${t.padStart(5, '0')},000 --> 00:${formatTime(parseTime(t) + 3).padStart(5, '0')},000\n${txt}\n\n`;
    });
    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transcript.srt'; a.click();
  });

  function parseTime(t) {
    const p = t.split(':');
    return parseInt(p[0]) * 60 + parseInt(p[1]);
  }
});
