import { checkProxiesAndFetch } from 'proxy-checker-lite';
import loadXLSFile from './loadXLSFile.ts';
import citreaDailyRequest from './checkin.ts';

/**
 * 随机延迟的时间范围（毫秒）
 * 这里设置为 1 到 10 分钟
 */
const MIN_DELAY = 1 * 60 * 1000; // 1 分钟
const MAX_DELAY = 10 * 60 * 1000; // 10 分钟
// 签到间隔时间，24 小时
const CHECK_INTERVAL = 24 * 60 * 60 * 1000;

// 记录每个 token 的上次签到时间
const lastCheckIn = new Map();
// 缓存已验证用户信息
const verifiedUsers = new Map();

/**
 * 生成一个随机的延迟时间
 *
 * @returns {number} 随机延迟时间（毫秒）
 */
function getRandomDelay() {
  return Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
}

/**
 * 执行签到逻辑
 *
 * @param {string} token - Discord 的 token。
 * @param {string} session - Discord 的 session ID。
 */
async function handleCheckIn(token, session) {
  const lastTime = lastCheckIn.get(token) || 0;
  const currentTime = Date.now();

  if (!session) return;

  if (currentTime - lastTime >= CHECK_INTERVAL) {
    const delay = getRandomDelay();
    const username = verifiedUsers.get(token)?.username || '未知用户';
    console.log(
      `⏳ ${username} 签到冷却完成，将在 ${Math.floor(
        delay / 1000
      )} 秒后开始签到`
    );

    // 延迟签到
    setTimeout(async () => {
      console.log(`🔄 ${username} 正在执行签到...`);
      const success = await citreaDailyRequest(token, session, null);
      if (success) {
        lastCheckIn.set(token, Date.now()); // 更新签到时间
        console.log(`✅ ${username} 签到成功！`);
      }
    }, delay);
  } else {
    const remainingTimeMs = CHECK_INTERVAL - (currentTime - lastTime);
    if (remainingTimeMs > 0) {
      const remainingHours = Math.floor(remainingTimeMs / (60 * 60 * 1000));
      const remainingMinutes = Math.ceil(
        (remainingTimeMs % (60 * 60 * 1000)) / (60 * 1000)
      );
      const username = verifiedUsers.get(token)?.username || '未知用户';
      console.log(
        `⏳ 签到冷却中，用户名：${username}，剩余时间：${remainingHours} 小时 ${remainingMinutes} 分钟`
      );
    }
  }
}

/**
 * 定时任务：每 10 分钟执行一次检查
 */
async function startScheduler() {
  console.log('🚀 开始定时任务，检查代理和签到状态');
  const proxyData = await loadXLSFile('./config.xlsx');
  const proxyisValid = await checkProxiesAndFetch(proxyData); // 立即执行一次
  if (proxyisValid) {
    console.log('✅ 代理验证成功！');
    // proxyData.forEach((config) => {
    //   handleCheckIn(config.token, config.session);
    // });
  }
}

// 启动任务
startScheduler();
