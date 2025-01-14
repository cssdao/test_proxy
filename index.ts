import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import loadXLSFile from './loadXLSFile.ts';

/**
 * 检查 SOCKS5 代理 IP 是否有效。
 *
 * @param {string} proxyUrl - SOCKS5 代理地址，格式为 socks5h://user:password@ip:port。
 * @param {number} index - 代理序号。
 * @returns {Promise<boolean>} - 如果代理有效返回 true，否则返回 false。
 */
async function checkProxy(proxyUrl: string, index: number) {
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
      return false;
    }

    // 发起请求检查 IP
    const response = await fetch('https://api.ipify.org?format=json', {
      agent,
    });

    if (!response.ok) {
      console.error(`❌代理无效！代理${index}: ${proxyUrl}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅代理有效！代理${index}: ${proxyUrl}，返回 IP: ${data.ip}`);
    return true;
  } catch (error) {
    console.error(`❌代理无效！代理${index}: ${proxyUrl}`);
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
  for (const [index, proxyUrl] of proxies.entries()) {
    await checkProxy(proxyUrl, index + 1);
  }
}

// 执行代理检查
checkProxies();
