import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import loadXLSFile from './loadXLSFile.ts';
import citreaDailyRequest from './checkin.ts';

/**
 * 随机延迟的时间范围（毫秒）
 * 这里设置为 1 到 10 分钟
 */
const MIN_DELAY = 1 * 60 * 1000; // 1 分钟
const MAX_DELAY = 10 * 60 * 1000; // 10 分钟
// 签到间隔时间，15 小时
const CHECK_INTERVAL = 15 * 60 * 60 * 1000;

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
 * 检查 SOCKS5 代理 IP 是否有效，并发送请求。
 *
 * @param {string} proxyUrl - SOCKS5 代理地址，格式为 socks5h://user:password@ip:port。
 * @param {string} token - Discord 的 token。
 * @param {string} session - Discord 的 session ID。
 * @returns {Promise<void>}
 */
async function checkProxyAndFetch(proxyUrl, token, session) {
  try {
    // 如果用户已验证，直接跳过验证逻辑
    if (verifiedUsers.has(token)) {
      await handleCheckIn(token, session);
      return;
    }

    let agent;

    // 根据代理协议选择代理 Agent
    if (proxyUrl.startsWith('socks')) {
      agent = new SocksProxyAgent(proxyUrl);
    } else if (proxyUrl.startsWith('http')) {
      agent = new HttpsProxyAgent(proxyUrl);
    } else {
      console.error(`❌ 代理 IP 格式不支持：${proxyUrl}`);
      return;
    }

    // 检查代理是否有效
    const ipResponse = await fetch('https://api.ipify.org?format=json', {
      agent,
    });

    if (!ipResponse.ok) {
      console.error(`❌  连接失败，无法访问 IP 服务：${proxyUrl}`);
      return;
    }

    const ipData = await ipResponse.json();
    console.log(`✅ 连接成功，代理 IP: ${ipData.ip}`);

    // 使用代理请求 Discord User API
    const discordResponse = await fetch(
      'https://discord.com/api/v9/users/@me',
      {
        agent,
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
          Connection: 'keep-alive',
        },
        keepalive: true,
      }
    );

    if (!discordResponse.ok) {
      console.error(`❌ 获取用户信息失败，Token 无效：${token}`);
      return;
    }

    const userData = await discordResponse.json();
    const username = userData.global_name || userData.username || '未知用户';
    console.log(
      `✅ 获取用户信息成功，用户名：${username}，邮箱：${
        userData.email || '未提供邮箱'
      }`
    );

    // 缓存用户信息
    verifiedUsers.set(token, { username, ip: ipData.ip });
    await handleCheckIn(token, session);
  } catch (error) {
    console.error(`❌ 请求失败：${proxyUrl}，错误信息：${error.message}`);
  }
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
 * 批量检查代理列表并请求 API。
 */
async function checkProxiesAndFetch() {
  const proxyData = await loadXLSFile('./config.xlsx');

  for (const [index, { proxy, token, session }] of proxyData.entries()) {
    console.log(`🔄 [代理${index + 1}] 准备测试，代理：${proxy}`);
    if (!proxy || !token) {
      console.warn(`⚠️ [代理${proxy}] 数据缺失，跳过测试`);
      continue;
    }
    await checkProxyAndFetch(proxy, token, session);
  }
}

/**
 * 定时任务：每 1 小时执行一次检查
 */
function startScheduler() {
  console.log('🚀 开始定时任务，每小时检查一次代理和签到状态');
  checkProxiesAndFetch(); // 立即执行一次
  setInterval(checkProxiesAndFetch, 60 * 60 * 1000); // 每小时执行
}

// 启动任务
startScheduler();
