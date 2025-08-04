/**
 * Video Information Extraction
 * 视频信息提取模块
 */

import { spawn } from 'child_process';
import { logger } from '../utils/logger.js';

const YT_DLP_PATH = process.env.YT_DLP_PATH || '/mnt/share/CACHEDEV1_DATA/homes/18617007050/codebase/wacken/yt-dlp';

/**
 * 获取视频基本信息
 */
export async function getVideoInfo(url) {
  try {
    logger.info('🔍 Extracting video information', { url });
    
    const command = YT_DLP_PATH;
    const args = [
      '--print', 'title',
      '--print', 'uploader', 
      '--print', 'duration_string',
      '--print', 'view_count',
      '--print', 'upload_date',
      url
    ];
    
    const result = await execCommand(command, args);
    const lines = result.split('\n').filter(line => line.trim());
    
    const videoInfo = {
      title: lines[0] || 'Unknown Title',
      uploader: lines[1] || 'Unknown Uploader',
      duration: lines[2] || 'Unknown Duration',
      view_count: lines[3] || null,
      upload_date: lines[4] || null,
      url: url
    };
    
    logger.info('📺 Video info extracted', { 
      title: videoInfo.title,
      uploader: videoInfo.uploader,
      duration: videoInfo.duration
    });
    
    return videoInfo;
    
  } catch (error) {
    logger.warn('⚠️  Failed to extract video info, using defaults', error);
    
    return {
      title: 'Unknown Video',
      uploader: 'Unknown Uploader', 
      duration: 'Unknown Duration',
      view_count: null,
      upload_date: null,
      url: url
    };
  }
}

/**
 * 执行命令并返回输出
 */
function execCommand(command, args, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Command timeout'));
    }, timeout);
    
    child.on('close', (code) => {
      clearTimeout(timer);
      
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}