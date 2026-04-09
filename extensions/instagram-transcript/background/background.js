// 后台服务脚本 - 管理免费次数
const FREE_DAILY_LIMIT = 100;
const WEBSITE_URL = 'https://transcripthub.net';

// 获取今日使用次数
async function getDailyUsage() {
  const data = await chrome.storage.local.get(['lastResetDate', 'usageCount']);
  const today = new Date().toDateString();
  
  if (data.lastResetDate !== today) {
    await chrome.storage.local.set({ 
      lastResetDate: today, 
      usageCount: 0 
    });
    return 0;
  }
  
  return data.usageCount || 0;
}

// 增加使用次数
async function incrementUsage() {
  const count = await getDailyUsage();
  await chrome.storage.local.set({ usageCount: count + 1 });
  return count + 1;
}

// 检查是否可以免费使用
async function canUseFree() {
  const count = await getDailyUsage();
  return count < FREE_DAILY_LIMIT;
}

// 监听来自popup和content的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === 'checkQuota') {
        const count = await getDailyUsage();
        const canUse = await canUseFree();
        sendResponse({ 
          success: true, 
          used: count, 
          limit: FREE_DAILY_LIMIT,
          canUse 
        });
        return;
      }
      
      if (request.action === 'incrementUsage') {
        await incrementUsage();
        const remaining = FREE_DAILY_LIMIT - (await getDailyUsage());
        sendResponse({ success: true, remaining });
        return;
      }
      
      if (request.action === 'openWebsite') {
        const url = request.url 
          ? `${WEBSITE_URL}/instagram-transcript?url=${encodeURIComponent(request.url)}`
          : WEBSITE_URL;
        await chrome.tabs.create({ url, active: true });
        sendResponse({ success: true });
        return;
      }
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: 'unknown',
        message: error.message 
      });
    }
  })();
  
  return true;
});
