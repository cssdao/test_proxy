import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import loadXLSFile from './loadXLSFile.ts';

/**
 * 检查 SOCKS5 代理 IP 是否有效，并发送请求。
 *
 * @param {string} proxyUrl - SOCKS5 代理地址，格式为 socks5h://user:password@ip:port。
 * @param {string} token - Discord 的 token。
 * @param {number} index - 代理序号。
 * @returns {Promise<void>}
 */
async function checkProxyAndFetch(
  proxyUrl: string,
  token: string,
  index: number
) {
  try {
    // 创建代理 agent
    let agent;

    // 根据代理协议选择合适的代理 Agent
    if (proxyUrl.startsWith('socks')) {
      agent = new SocksProxyAgent(proxyUrl);
    } else if (proxyUrl.startsWith('http')) {
      agent = new HttpsProxyAgent(proxyUrl);
    } else {
      console.error(`❌代理格式不支持！代理${index}: ${proxyUrl}`);
      return;
    }

    // 检查代理是否有效
    const ipResponse = await fetch('https://api.ipify.org?format=json', {
      agent,
    });

    if (!ipResponse.ok) {
      console.error(`❌代理无效！代理${index}: ${proxyUrl}`);
      return;
    }

    const ipData = await ipResponse.json();
    console.log(`✅代理有效！代理${index}: ${proxyUrl}，返回 IP: ${ipData.ip}`);

    // 使用代理请求 Discord User API
    const discordResponse = await fetch(
      'https://discord.com/api/v9/users/@me',
      {
        agent,
        headers: {
          Authorization: this.token,
          'Content-Type': 'application/json',
          Connection: 'keep-alive',
        },
        keepalive: true,
      }
    );

    if (!discordResponse.ok) {
      console.error(`❌请求 Discord API 失败！代理${index}: ${proxyUrl}`);
      return;
    }

    const discordData = await discordResponse.json();
    console.log(
      `🎉Discord API 响应成功！代理${index}: ${proxyUrl}`,
      discordData
    );
  } catch (error) {
    console.error(`❌操作失败！代理${index}: ${proxyUrl}`, error.message);
  }
}

/**
 * 批量检查代理列表并请求 API。
 */
async function checkProxiesAndFetch() {
  const proxyData = await loadXLSFile('./config.xlsx');
  for (const [index, { proxy, token }] of proxyData.entries()) {
    console.log(proxy, token);
    if (!proxy || !token) {
      console.warn(`⚠️ 数据缺失，跳过代理${index + 1}`);
      continue;
    }
    await checkProxyAndFetch(proxy, token, index + 1);
  }
}

// 执行代理检查和请求
checkProxiesAndFetch();
