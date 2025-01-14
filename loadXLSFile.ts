import { readFile } from 'fs/promises';
import * as XLSX from 'xlsx';

export default async function loadFromXLS(filePath) {
  const configs: any[] = [];
  try {
    const fileData = await readFile(filePath);
    const workbook = XLSX.read(fileData, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // 获取第一个工作表
    const worksheet = workbook.Sheets[sheetName];

    // 将工作表转换为 JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    data.forEach((row: { proxy: string; token: string }) => {
      // 验证必要字段
      if (!row.proxy) {
        console.warn('跳过无效配置行：', row);

        return;
      }

      // 使用解构赋值简化推送配置
      const { proxy, token } = row;

      configs.push({
        proxy,
        token,
      });
    });

    return configs;
  } catch (error) {
    console.error('读取 XLS 文件时出错：', error);
    throw error;
  }
}
