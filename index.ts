import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import loadXLSFile from './loadXLSFile.ts';

/**
 * 检查 SOCKS5 代理 IP 是否有效。
 *
 * @param {string} proxyUrl - SOCKS5 代理地址，格式为 socks5h://user:password@ip:port。
 * @returns {Promise<boolean>} - 如果代理有效返回 true，否则返回 false。
 */
async function checkProxy(proxyUrl: string) {
  try {
    // 创建代理 agent
    const agent = new SocksProxyAgent(proxyUrl);
    // 发起请求检查 IP
    const response = await fetch('https://api.ipify.org?format=json', {
      agent,
    });

    if (!response.ok) {
      console.error(`❌代理无效！代理: ${proxyUrl}`);
    }

    const data = await response.json();
    console.log(`✅代理有效！代理: ${proxyUrl}，返回 IP: ${data.ip}`);
    return true;
  } catch (error) {
    console.error(`❌代理无效！代理: ${proxyUrl}`);
    return false;
  }
}

/**
 * 批量检查代理列表。
 *
 * @param {string[]} proxies - 代理地址数组。
 */
async function checkProxies() {
  const proxies = await loadXLSFile('./config.xlsx');
  for (const proxyUrl of proxies) {
    await checkProxy(proxyUrl);
  }
}

// 执行代理检查
checkProxies();
