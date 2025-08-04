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
  
  // 搜索配置
  searchEnabled: false,
  searchTimeout: 30000,
  maxSearchResults: 10,
  
  // 文件管理配置
  autoCleanup: true,
  keepFragments: false,
  downloadHistoryRetentionDays: 30,
  
  // API配置
  googleSearchApiKey: null,
  googleSearchEngineId: null,
  bingSearchApiKey: null
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
  
  // 搜索API配置
  if (process.env.GOOGLE_SEARCH_API_KEY) {
    config.googleSearchApiKey = process.env.GOOGLE_SEARCH_API_KEY;
    config.searchEnabled = true;
  }
  
  if (process.env.GOOGLE_SEARCH_ENGINE_ID) {
    config.googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  }
  
  if (process.env.BING_SEARCH_API_KEY) {
    config.bingSearchApiKey = process.env.BING_SEARCH_API_KEY;
    config.searchEnabled = true;
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
 * 检查搜索功能是否已配置
 */
export function isSearchEnabled() {
  const config = getConfig();
  return config.searchEnabled && (
    (config.googleSearchApiKey && config.googleSearchEngineId) ||
    config.bingSearchApiKey
  );
}

/**
 * 获取配置摘要（用于日志）
 */
export function getConfigSummary() {
  const config = getConfig();
  
  return {
    downloadPath: config.downloadPath,
    ytDlpPath: config.ytDlpPath,
    searchEnabled: isSearchEnabled(),
    defaultQuality: config.defaultQuality,
    autoCleanup: config.autoCleanup,
    maxRetries: config.maxRetries
  };
}

/**
 * 创建示例配置文件
 */
export function createExampleConfig() {
  const exampleEnv = `# Natural Video Downloader MCP Server Configuration

# 基础配置
DOWNLOAD_PATH=/mnt/share/movie
LOG_LEVEL=INFO

# yt-dlp配置  
YT_DLP_PATH=/usr/local/bin/yt-dlp
MAX_RETRIES=10
CONCURRENT_FRAGMENTS=4
THROTTLED_RATE=100K
DEFAULT_QUALITY=best

# 搜索功能配置（可选）
# GOOGLE_SEARCH_API_KEY=your_google_api_key
# GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
# BING_SEARCH_API_KEY=your_bing_api_key

# 文件管理配置
AUTO_CLEANUP=true
KEEP_FRAGMENTS=false
DOWNLOAD_HISTORY_RETENTION_DAYS=30

# MCP服务器配置
SERVER_NAME=natural-video-downloader
SERVER_VERSION=1.0.0
`;

  return exampleEnv;
}