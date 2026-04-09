// 后台服务脚本 - 管理有限的免费次数
const FREE_LIMIT = 2;
const WEBSITE_URL = 'https://transcripthub.net';

// 获取总计使用次数
async function getTotalUsage() {
  const data = await chrome.storage.local.get(['usageCount']);
  return data.usageCount || 0;
}

// 增加使用次数
async function incrementUsage() {
  const count = await getTotalUsage();
  await chrome.storage.local.set({ usageCount: count + 1 });
  return count + 1;
}

// 监听来自popup和content的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkQuota') {
    (async () => {
      const count = await getTotalUsage();
      const canUse = count < FREE_LIMIT;
      sendResponse({
        success: true,
        used: count,
        limit: FREE_LIMIT,
        canUse
      });
    })();
    return true;
  }

  if (request.action === 'incrementUsage') {
    (async () => {
      const count = await incrementUsage();
      const remaining = Math.max(0, FREE_LIMIT - count);
      sendResponse({ success: true, remaining });
    })();
    return true;
  }

  if (request.action === 'openWebsite') {
    const targetUrl = request.url
      ? `${WEBSITE_URL}/instagram-transcript?url=${encodeURIComponent(request.url)}`
      : WEBSITE_URL;
    chrome.tabs.create({ url: targetUrl, active: true });
    sendResponse({ success: true });
    return true;
  }
});
