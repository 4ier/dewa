/**
 * Input Validation Utilities
 * 输入验证工具函数
 */

import { z } from 'zod';

/**
 * 检测输入是否为直接URL
 */
export function isDirectURL(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const urlPatterns = [
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i,
    /^https?:\/\/(www\.)?bilibili\.com/i,
    /^https?:\/\/(www\.)?magentamusik\.de/i,
    /^https?:\/\/(www\.)?vimeo\.com/i,
    /^https?:\/\/(www\.)?twitch\.tv/i,
    /^https?:\/\/.*\.(mp4|mkv|webm|avi|mov)$/i // 直接视频文件链接
  ];
  
  return urlPatterns.some(pattern => pattern.test(input.trim()));
}

/**
 * 验证URL格式
 */
export function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证视频质量参数
 */
export function isValidQuality(quality) {
  const validQualities = ['best', 'worst', '1080p', '720p', '480p', '360p'];
  return validQualities.includes(quality);
}

/**
 * 验证平台名称
 */
export function isValidPlatform(platform) {
  const validPlatforms = ['youtube', 'bilibili', 'magentamusik', 'vimeo', 'twitch', 'any', 'all'];
  return validPlatforms.includes(platform);
}

/**
 * 验证文件路径
 */
export function isValidPath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }
  
  // 检查是否包含危险字符
  const dangerousPatterns = [
    /\.\./,  // 路径遍历
    /[<>:"|?*]/,  // Windows保留字符
    /^\/dev\/|^\/proc\/|^\/sys\//,  // Linux系统目录
    /^CON$|^PRN$|^AUX$|^NUL$/i  // Windows保留名称
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(filePath));
}

/**
 * 验证文件名
 */
export function isValidFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return false;
  }
  
  // 检查长度
  if (filename.length > 255) {
    return false;
  }
  
  // 检查是否包含危险字符
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(filename)) {
    return false;
  }
  
  // 检查Windows保留名称
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reservedNames.test(filename)) {
    return false;
  }
  
  return true;
}

/**
 * 清理和验证搜索查询
 */
export function sanitizeSearchQuery(query) {
  if (!query || typeof query !== 'string') {
    return '';
  }
  
  return query
    .trim()
    .replace(/\s+/g, ' ')  // 合并多个空格
    .replace(/[^\w\s\u4e00-\u9fff\-_.]/g, '')  // 只保留字母、数字、中文、空格和常用符号
    .substring(0, 200);  // 限制长度
}

/**
 * 验证数字参数
 */
export function isValidNumber(value, min = 0, max = Infinity) {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Zod验证模式
 */

// URL验证模式
export const URLSchema = z.string().url('Invalid URL format');

// 搜索查询验证模式
export const SearchQuerySchema = z.string()
  .min(1, 'Search query cannot be empty')
  .max(200, 'Search query too long')
  .transform(sanitizeSearchQuery);

// 平台验证模式
export const PlatformSchema = z.enum(['youtube', 'bilibili', 'magentamusik', 'vimeo', 'twitch', 'any', 'all']);

// 质量验证模式
export const QualitySchema = z.enum(['best', 'worst', '1080p', '720p', '480p', '360p']);

// 文件路径验证模式
export const FilePathSchema = z.string()
  .refine(isValidPath, 'Invalid file path')
  .optional();

// 文件名验证模式
export const FilenameSchema = z.string()
  .refine(isValidFilename, 'Invalid filename')
  .optional();

// 数量限制验证模式
export const LimitSchema = z.number()
  .int('Limit must be an integer')
  .min(1, 'Limit must be at least 1')
  .max(100, 'Limit cannot exceed 100');

/**
 * 综合验证工具类
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class Validator {
  static validateDownloadRequest(params) {
    const errors = [];
    
    if (!params.query) {
      errors.push('Query is required');
    } else if (isDirectURL(params.query) && !isValidURL(params.query)) {
      errors.push('Invalid URL format');
    }
    
    if (params.platform_preference && !isValidPlatform(params.platform_preference)) {
      errors.push('Invalid platform preference');
    }
    
    if (params.quality && !isValidQuality(params.quality)) {
      errors.push('Invalid quality setting');
    }
    
    if (params.custom_directory && !isValidPath(params.custom_directory)) {
      errors.push('Invalid custom directory path');
    }
    
    if (params.custom_filename && !isValidFilename(params.custom_filename)) {
      errors.push('Invalid custom filename');
    }
    
    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
    
    return true;
  }
  
  static validateSearchRequest(params) {
    const errors = [];
    
    if (!params.query) {
      errors.push('Search query is required');
    } else if (params.query.trim().length === 0) {
      errors.push('Search query cannot be empty');
    }
    
    if (params.platform && !isValidPlatform(params.platform)) {
      errors.push('Invalid platform');
    }
    
    if (params.limit && !isValidNumber(params.limit, 1, 100)) {
      errors.push('Invalid limit (must be between 1 and 100)');
    }
    
    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
    
    return true;
  }
}