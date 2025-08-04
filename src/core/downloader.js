/**
 * Core Video Downloader
 * 核心下载引擎
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { detectPlatform } from './platforms.js';
import { generateFilename, ensureDirectoryExists } from './file-manager.js';
import { getVideoInfo } from './video-info.js';
import { saveDownloadRecord, updateDownloadStatus } from './download-manager.js';
import { logger } from '../utils/logger.js';

// 默认配置
const DEFAULT_CONFIG = {
  downloadPath: process.env.DOWNLOAD_PATH || '/tmp/downloads',
  ytDlpPath: process.env.YT_DLP_PATH || 'yt-dlp',
  maxRetries: 10,
  fragmentRetries: 10,
  concurrentFragments: 4,
  throttledRate: '100K'
};

/**
 * 主要的视频下载函数
 */
export async function downloadVideo(options) {
  const startTime = new Date();
  const {
    url,
    quality = 'best',
    customDirectory = null,
    customFilename = null,
    metadata = {}
  } = options;

  let downloadId = null;

  try {
    logger.info('🎬 Starting video download', { url, quality });

    // 1. 检测平台
    const platform = detectPlatform(url);
    logger.info(`🏷️  Platform detected: ${platform.name}`);

    // 2. 获取视频信息
    let videoInfo = metadata;
    if (!videoInfo.title || !videoInfo.uploader) {
      videoInfo = await getVideoInfo(url);
    }
    logger.info('📺 Video info obtained', { title: videoInfo.title });

    // 3. 生成文件名和路径
    const filename = customFilename || generateFilename(videoInfo, platform);
    const directory = customDirectory || path.join(DEFAULT_CONFIG.downloadPath, platform.directory);
    ensureDirectoryExists(directory);
    
    const outputPath = path.join(directory, filename);
    logger.info('📁 Output path determined', { outputPath });

    // 4. 检查文件是否已存在
    if (fs.existsSync(outputPath)) {
      logger.info('⚠️  File already exists, skipping download');
      return {
        success: true,
        data: {
          title: videoInfo.title,
          file_path: outputPath,
          platform: platform.name,
          file_size: getFileSize(outputPath),
          download_time: startTime.toISOString(),
          metadata: videoInfo,
          status: 'already_exists'
        }
      };
    }

    // 5. 保存下载记录
    downloadId = await saveDownloadRecord({
      url,
      title: videoInfo.title,
      platform: platform.name,
      output_path: outputPath,
      status: 'in_progress',
      started_at: startTime,
      metadata: videoInfo
    });

    // 6. 执行下载
    const downloadResult = await executeDownload({
      url,
      outputPath,
      quality,
      videoInfo,
      downloadId
    });

    if (downloadResult.success) {
      // 更新下载状态
      await updateDownloadStatus(downloadId, 'completed', {
        completed_at: new Date(),
        file_path: outputPath,
        file_size: getFileSize(outputPath)
      });

      return {
        success: true,
        data: {
          title: videoInfo.title,
          file_path: outputPath,
          platform: platform.name,
          file_size: getFileSize(outputPath),
          download_time: startTime.toISOString(),
          metadata: videoInfo
        }
      };
    } else {
      throw new Error(downloadResult.error);
    }

  } catch (error) {
    logger.error('💥 Download failed', { url, error: error.message });

    // 更新失败状态
    if (downloadId) {
      await updateDownloadStatus(downloadId, 'failed', {
        failed_at: new Date(),
        error_message: error.message
      });
    }

    return {
      success: false,
      error: {
        code: 'DOWNLOAD_FAILED',
        message: error.message,
        url: url
      }
    };
  }
}

/**
 * 执行实际的下载过程
 */
async function executeDownload({ url, outputPath, quality, videoInfo, downloadId }) {
  return new Promise((resolve, reject) => {
    const args = [
      '--continue',                    // 断点续传
      '--keep-fragments',              // 保持碎片文件防止数据丢失
      '--no-warnings',                 // 减少噪音
      '--newline',                     // 进度显示在新行
      '--concurrent-fragments', DEFAULT_CONFIG.concurrentFragments.toString(),
      '--retries', DEFAULT_CONFIG.maxRetries.toString(),
      '--fragment-retries', DEFAULT_CONFIG.fragmentRetries.toString(),
      '--throttled-rate', DEFAULT_CONFIG.throttledRate,
      '--format', quality,
      '--output', outputPath,
      url
    ];

    logger.info('🚀 Executing yt-dlp', { command: DEFAULT_CONFIG.ytDlpPath, args });

    const child = spawn(DEFAULT_CONFIG.ytDlpPath, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let lastProgress = '';

    // 处理标准输出（进度信息）
    child.stdout.on('data', (data) => {
      const output = data.toString();
      
      // 提取进度信息
      const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (progressMatch) {
        const progress = progressMatch[1];
        if (progress !== lastProgress) {
          lastProgress = progress;
          logger.info(`📥 Download progress: ${progress}%`);
          
          // 更新下载进度（可选）
          if (downloadId) {
            updateDownloadStatus(downloadId, 'in_progress', { progress: `${progress}%` })
              .catch(err => logger.warn('Failed to update progress:', err));
          }
        }
      }
    });

    // 处理错误输出
    child.stderr.on('data', (data) => {
      const error = data.toString();
      logger.warn('⚠️  yt-dlp stderr:', error);
    });

    // 处理进程结束
    child.on('close', (code) => {
      if (code === 0) {
        logger.info('✅ Download completed successfully');
        
        // 清理碎片文件
        cleanupFragments(outputPath);
        
        resolve({ success: true });
      } else {
        logger.error(`❌ Download failed with exit code: ${code}`);
        resolve({ 
          success: false, 
          error: `Download process failed with exit code: ${code}` 
        });
      }
    });

    // 处理进程错误
    child.on('error', (error) => {
      logger.error('💥 Process error:', error);
      resolve({ 
        success: false, 
        error: `Process error: ${error.message}` 
      });
    });
  });
}

/**
 * 清理碎片文件
 */
function cleanupFragments(outputPath) {
  try {
    const directory = path.dirname(outputPath);
    const baseName = path.basename(outputPath, '.mp4');
    const files = fs.readdirSync(directory);
    
    const fragments = files.filter(f => 
      f.startsWith(`${baseName}.mp4.part-Frag`) ||
      f === `${baseName}.mp4.ytdl` ||
      f === `${baseName}.mp4.part` ||
      f.startsWith(`${baseName}.f`) ||
      (f.includes(baseName) && f.includes('.part-'))
    );
    
    let totalSize = 0;
    fragments.forEach(frag => {
      try {
        const fragPath = path.join(directory, frag);
        const stats = fs.statSync(fragPath);
        totalSize += stats.size;
        fs.unlinkSync(fragPath);
      } catch (e) {
        // 忽略删除失败
      }
    });
    
    if (fragments.length > 0) {
      logger.info(`🧹 Cleaned up ${fragments.length} fragment files (${(totalSize / 1024 / 1024).toFixed(2)} MB freed)`);
    }
  } catch (error) {
    logger.warn('⚠️  Fragment cleanup failed:', error.message);
  }
}

/**
 * 获取文件大小
 */
function getFileSize(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      return `${sizeMB} MB`;
    }
  } catch (e) {
    // 忽略错误
  }
  return 'Unknown';
}