/**
 * Configuration Management
 * 配置管理工具
 */

import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';
import { ensureYtDlp } from './yt-dlp-installer.js';

// 默认配置
const DEFAULT_CONFIG = {
  // 基础配置
  downloadPath: '/tmp/downloads',
  logLevel: 'INFO',
  
  // 下载配置
  ytDlpPath: null,  // 将通过自动检测确定
  maxRetries: 10,
  fragmentRetries: 10,
  concurrentFragments: 4,
  throttledRate: '100K',
  defaultQuality: 'best',
  
  // 文件管理配置
  autoCleanup: true,
  keepFragments: false,
  downloadHistoryRetentionDays: 30
};

/**
 * 验证配置
 */
export async function validateConfig() {
  const config = await getConfig();
  const errors = [];
  
  // 验证必需路径
  if (!config.downloadPath) {
    errors.push('Download path is required');
  }
  
  // yt-dlp路径将在getConfig中自动确保可用
  if (!config.ytDlpPath) {
    errors.push('yt-dlp could not be found or installed');
  }
  
  // 验证下载路径权限
  try {
    if (!fs.existsSync(config.downloadPath)) {
      fs.mkdirSync(config.downloadPath, { recursive: true });
    }
    
    // 测试写入权限
    const testFile = path.join(config.downloadPath, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
  } catch (error) {
    errors.push(`Download path is not writable: ${config.downloadPath}`);
  }
  
  // 验证数值配置
  if (config.maxRetries < 1 || config.maxRetries > 100) {
    errors.push('maxRetries must be between 1 and 100');
  }
  
  if (config.concurrentFragments < 1 || config.concurrentFragments > 32) {
    errors.push('concurrentFragments must be between 1 and 32');
  }
  
  if (errors.length > 0) {
    const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  logger.info('✅ Configuration validated successfully');
  return true;
}

/**
 * 获取当前配置
 */
export async function getConfig() {
  const config = { ...DEFAULT_CONFIG };
  
  // 从环境变量覆盖配置
  if (process.env.DOWNLOAD_PATH) {
    config.downloadPath = process.env.DOWNLOAD_PATH;
  }
  
  if (process.env.LOG_LEVEL) {
    config.logLevel = process.env.LOG_LEVEL;
  }
  
  // 确保yt-dlp可用（自动检测或安装）
  try {
    config.ytDlpPath = await ensureYtDlp();
  } catch (error) {
    logger.error('Failed to ensure yt-dlp availability:', error);
    // 如果有环境变量指定路径，使用它作为后备
    if (process.env.YT_DLP_PATH) {
      config.ytDlpPath = process.env.YT_DLP_PATH;
    }
  }
  
  if (process.env.MAX_RETRIES) {
    config.maxRetries = parseInt(process.env.MAX_RETRIES, 10);
  }
  
  if (process.env.CONCURRENT_FRAGMENTS) {
    config.concurrentFragments = parseInt(process.env.CONCURRENT_FRAGMENTS, 10);
  }
  
  if (process.env.THROTTLED_RATE) {
    config.throttledRate = process.env.THROTTLED_RATE;
  }
  
  if (process.env.DEFAULT_QUALITY) {
    config.defaultQuality = process.env.DEFAULT_QUALITY;
  }
  
  // 布尔值配置
  if (process.env.AUTO_CLEANUP) {
    config.autoCleanup = process.env.AUTO_CLEANUP.toLowerCase() === 'true';
  }
  
  if (process.env.KEEP_FRAGMENTS) {
    config.keepFragments = process.env.KEEP_FRAGMENTS.toLowerCase() === 'true';
  }
  
  return config;
}

/**
 * 获取特定配置项
 */
export async function getConfigValue(key, defaultValue = null) {
  const config = await getConfig();
  return config[key] !== undefined ? config[key] : defaultValue;
}


/**
 * 获取配置摘要（用于日志）
 */
export async function getConfigSummary() {
  const config = await getConfig();
  
  return {
    downloadPath: config.downloadPath,
    ytDlpPath: config.ytDlpPath ? 'detected' : 'not found',
    defaultQuality: config.defaultQuality,
    autoCleanup: config.autoCleanup,
    maxRetries: config.maxRetries
  };
}

/**
 * 创建示例配置文件
 */
export function createExampleConfig() {
  const exampleEnv = `# DEWA - Download Everything With AI MCP Server Configuration

# 基础配置
DOWNLOAD_PATH=/your/download/path
LOG_LEVEL=INFO

# 可选配置 - 系统会自动检测和安装yt-dlp
# YT_DLP_PATH=/custom/path/to/yt-dlp
# DEFAULT_QUALITY=best
# AUTO_CLEANUP=true
`;

  return exampleEnv;
}