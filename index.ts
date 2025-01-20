import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import loadXLSFile from './loadXLSFile.ts';
import citreaDailyRequest from './checkin.ts';

/**
 * 检查 SOCKS5 代理 IP 是否有效，并发送请求。
 *
 * @param {string} proxyUrl - SOCKS5 代理地址，格式为 socks5h://user:password@ip:port。
 * @param {string} token - Discord 的 token。
 * @param {string} session - Discord 的 session ID。
 * @param {number} index - 代理序号。
 * @returns {Promise<void>}
 */
async function checkProxyAndFetch(
  proxyUrl: string,
  token: string,
  session: string
) {
  try {
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

    if (session) {
      await citreaDailyRequest(token, session, agent);
    }


    const userData = await discordResponse.json();
    console.log(
      `✅ 获取用户信息成功，用户名：${userData.global_name}，邮箱：${userData.email || '未提供邮箱'
      }`
    );
  } catch (error) {
    console.error(`❌ 请求失败：${proxyUrl}，错误信息：${error.message}`);
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

// 执行代理检查和请求
checkProxiesAndFetch();
