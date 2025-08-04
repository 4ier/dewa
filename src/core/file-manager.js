/**
 * File Management Utilities
 * 文件管理工具，包括路径生成、文件命名等
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

/**
 * 生成安全的文件名
 */
export function generateFilename(videoInfo, platform) {
  const { title, uploader } = videoInfo;
  const sanitizedTitle = sanitizeFilename(title || 'Unknown Video');
  const sanitizedUploader = sanitizeFilename(uploader || 'Unknown');
  
  let filename;
  
  switch (platform.name) {
    case 'youtube':
      filename = `${sanitizedTitle} - ${sanitizedUploader}.mp4`;
      break;
    case 'bilibili':
      filename = `${platform.prefix}${sanitizedTitle} - ${sanitizedUploader}.mp4`;
      break;
    case 'magentamusik':
      filename = `${sanitizedTitle}.mp4`;
      break;
    default:
      filename = `${platform.prefix}${sanitizedTitle}.mp4`;
  }
  
  // 确保文件名不会太长
  if (filename.length > 255) {
    const maxTitleLength = 200 - platform.prefix.length;
    const truncatedTitle = sanitizedTitle.substring(0, maxTitleLength);
    filename = `${platform.prefix}${truncatedTitle}.mp4`;
  }
  
  return filename;
}

/**
 * 清理文件名中的不安全字符
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'Unknown';
  }
  
  return filename
    // 移除或替换不安全的字符
    .replace(/[<>:"/\\|?*]/g, '-')
    // 替换连续的空格为单个空格
    .replace(/\s+/g, ' ')
    // 移除首尾空格
    .trim()
    // 移除连续的横线
    .replace(/-+/g, '-')
    // 移除首尾横线
    .replace(/^-+|-+$/g, '')
    // 限制长度
    .substring(0, 200)
    || 'Unknown'; // 如果清理后为空，使用默认名称
}

/**
 * 确保目录存在，如果不存在则创建
 */
export function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`📁 Created directory: ${dirPath}`);
    }
    return true;
  } catch (error) {
    logger.error(`❌ Failed to create directory: ${dirPath}`, error);
    throw new Error(`Failed to create directory: ${error.message}`);
  }
}

/**
 * 检查文件是否存在且完整
 */
export function isFileComplete(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    const stats = fs.statSync(filePath);
    
    // 检查文件大小是否大于0
    if (stats.size === 0) {
      return false;
    }
    
    // 检查是否存在对应的.part文件（表示下载未完成）
    const partFile = `${filePath}.part`;
    if (fs.existsSync(partFile)) {
      return false;
    }
    
    return true;
  } catch (error) {
    logger.warn(`⚠️  Error checking file completeness: ${filePath}`, error);
    return false;
  }
}

/**
 * 获取文件信息
 */
export function getFileInfo(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const stats = fs.statSync(filePath);
    
    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      isComplete: isFileComplete(filePath)
    };
  } catch (error) {
    logger.warn(`⚠️  Error getting file info: ${filePath}`, error);
    return null;
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(2);
  
  return `${size} ${units[i]}`;
}

/**
 * 生成唯一文件名（如果文件已存在）
 */
export function generateUniqueFilename(baseFilePath) {
  const dir = path.dirname(baseFilePath);
  const name = path.basename(baseFilePath, '.mp4');
  const ext = '.mp4';
  
  let counter = 1;
  let uniquePath = baseFilePath;
  
  while (fs.existsSync(uniquePath)) {
    uniquePath = path.join(dir, `${name} (${counter})${ext}`);
    counter++;
    
    // 防止无限循环
    if (counter > 1000) {
      uniquePath = path.join(dir, `${name}_${Date.now()}${ext}`);
      break;
    }
  }
  
  return uniquePath;
}

/**
 * 清理下载目录中的临时文件
 */
export function cleanupTemporaryFiles(directory) {
  try {
    if (!fs.existsSync(directory)) {
      return { cleaned: 0, size: 0 };
    }
    
    const files = fs.readdirSync(directory);
    let cleanedCount = 0;
    let totalSize = 0;
    
    // 查找临时文件
    const tempPatterns = [
      /\.part$/,
      /\.part-Frag/,
      /\.ytdl$/,
      /\.temp$/,
      /\.tmp$/
    ];
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const isTemp = tempPatterns.some(pattern => pattern.test(file));
      
      if (isTemp) {
        try {
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
          fs.unlinkSync(filePath);
          cleanedCount++;
        } catch (e) {
          logger.warn(`⚠️  Failed to delete temp file: ${file}`, e);
        }
      }
    });
    
    if (cleanedCount > 0) {
      logger.info(`🧹 Cleaned ${cleanedCount} temporary files (${formatFileSize(totalSize)} freed)`);
    }
    
    return { 
      cleaned: cleanedCount, 
      size: totalSize,
      sizeFormatted: formatFileSize(totalSize)
    };
    
  } catch (error) {
    logger.error('❌ Error cleaning temporary files:', error);
    return { cleaned: 0, size: 0 };
  }
}

/**
 * 获取目录使用统计
 */
export function getDirectoryStats(directory) {
  try {
    if (!fs.existsSync(directory)) {
      return null;
    }
    
    const files = fs.readdirSync(directory);
    let totalSize = 0;
    let fileCount = 0;
    let videoCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
          fileCount++;
          
          if (file.endsWith('.mp4') || file.endsWith('.mkv') || file.endsWith('.webm')) {
            videoCount++;
          }
        }
      } catch (e) {
        // 忽略无法访问的文件
      }
    });
    
    return {
      directory,
      totalSize,
      totalSizeFormatted: formatFileSize(totalSize),
      fileCount,
      videoCount,
      tempFileCount: fileCount - videoCount
    };
    
  } catch (error) {
    logger.error(`❌ Error getting directory stats: ${directory}`, error);
    return null;
  }
}