/**
 * Configuration Management
 * 配置管理工具
 */

import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

// 默认配置
const DEFAULT_CONFIG = {
  // 基础配置
  downloadPath: '/tmp/downloads',
  logLevel: 'INFO',
  
  // 下载配置
  ytDlpPath: '/usr/local/bin/yt-dlp',
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
export function validateConfig() {
  const config = getConfig();
  const errors = [];
  
  // 验证必需路径
  if (!config.downloadPath) {
    errors.push('Download path is required');
  }
  
  if (!config.ytDlpPath) {
    errors.push('yt-dlp path is required');
  } else if (!fs.existsSync(config.ytDlpPath)) {
    errors.push(`yt-dlp not found at: ${config.ytDlpPath}`);
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
export function getConfig() {
  const config = { ...DEFAULT_CONFIG };
  
  // 从环境变量覆盖配置
  if (process.env.DOWNLOAD_PATH) {
    config.downloadPath = process.env.DOWNLOAD_PATH;
  }
  
  if (process.env.LOG_LEVEL) {
    config.logLevel = process.env.LOG_LEVEL;
  }
  
  if (process.env.YT_DLP_PATH) {
    config.ytDlpPath = process.env.YT_DLP_PATH;
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
export function getConfigValue(key, defaultValue = null) {
  const config = getConfig();
  return config[key] !== undefined ? config[key] : defaultValue;
}


/**
 * 获取配置摘要（用于日志）
 */
export function getConfigSummary() {
  const config = getConfig();
  
  return {
    downloadPath: config.downloadPath,
    ytDlpPath: config.ytDlpPath,
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
DOWNLOAD_PATH=/mnt/share/movie
LOG_LEVEL=INFO

# yt-dlp配置  
YT_DLP_PATH=/usr/local/bin/yt-dlp
MAX_RETRIES=10
CONCURRENT_FRAGMENTS=4
THROTTLED_RATE=100K
DEFAULT_QUALITY=best

# 文件管理配置
AUTO_CLEANUP=true
KEEP_FRAGMENTS=false
DOWNLOAD_HISTORY_RETENTION_DAYS=30

# MCP服务器配置
SERVER_NAME=dewa
SERVER_VERSION=1.0.0
`;

  return exampleEnv;
}