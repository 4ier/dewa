/**
 * Download Manager
 * 下载记录管理和状态跟踪
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

const DOWNLOAD_HISTORY_FILE = process.env.DOWNLOAD_HISTORY_FILE || 
  path.join(process.cwd(), 'downloads.json');

/**
 * 保存下载记录
 */
export async function saveDownloadRecord(record) {
  try {
    const downloadId = generateDownloadId();
    const downloadRecord = {
      id: downloadId,
      ...record,
      created_at: new Date().toISOString()
    };
    
    const history = await loadDownloadHistory();
    history.push(downloadRecord);
    
    await saveDownloadHistory(history);
    logger.info('📝 Download record saved', { id: downloadId, title: record.title });
    
    return downloadId;
  } catch (error) {
    logger.error('❌ Failed to save download record', error);
    throw error;
  }
}

/**
 * 更新下载状态
 */
export async function updateDownloadStatus(downloadId, status, additionalData = {}) {
  try {
    const history = await loadDownloadHistory();
    const recordIndex = history.findIndex(record => record.id === downloadId);
    
    if (recordIndex === -1) {
      throw new Error(`Download record not found: ${downloadId}`);
    }
    
    history[recordIndex] = {
      ...history[recordIndex],
      status,
      ...additionalData,
      updated_at: new Date().toISOString()
    };
    
    await saveDownloadHistory(history);
    logger.info('📝 Download status updated', { id: downloadId, status });
    
    return history[recordIndex];
  } catch (error) {
    logger.error('❌ Failed to update download status', error);
    throw error;
  }
}

/**
 * 获取下载历史
 */
export async function getDownloadHistory(filters = {}) {
  try {
    let history = await loadDownloadHistory();
    
    // 应用过滤器
    if (filters.status && filters.status !== 'all') {
      history = history.filter(record => record.status === filters.status);
    }
    
    if (filters.platform && filters.platform !== 'all') {
      history = history.filter(record => record.platform === filters.platform);
    }
    
    // 排序
    if (filters.sort_by) {
      history.sort((a, b) => {
        const aVal = a[filters.sort_by] || '';
        const bVal = b[filters.sort_by] || '';
        
        if (filters.sort_order === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    // 限制数量  
    if (filters.limit) {
      history = history.slice(0, filters.limit);
    }
    
    return history;
  } catch (error) {
    logger.error('❌ Failed to get download history', error);
    return [];
  }
}

/**
 * 获取当前进行中的下载
 */
export async function getCurrentDownloads() {
  try {
    const history = await loadDownloadHistory();
    return history.filter(record => record.status === 'in_progress');
  } catch (error) {
    logger.error('❌ Failed to get current downloads', error);
    return [];
  }
}

/**
 * 删除下载记录
 */
export async function deleteDownloadRecord(downloadId) {
  try {
    const history = await loadDownloadHistory();
    const filteredHistory = history.filter(record => record.id !== downloadId);
    
    if (filteredHistory.length === history.length) {
      throw new Error(`Download record not found: ${downloadId}`);
    }
    
    await saveDownloadHistory(filteredHistory);
    logger.info('🗑️  Download record deleted', { id: downloadId });
    
    return true;
  } catch (error) {
    logger.error('❌ Failed to delete download record', error);
    throw error;
  }
}

/**
 * 清理过期的下载记录
 */
export async function cleanupOldRecords(daysToKeep = 30) {
  try {
    const history = await loadDownloadHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const filteredHistory = history.filter(record => {
      const recordDate = new Date(record.created_at);
      return recordDate > cutoffDate;
    });
    
    const deletedCount = history.length - filteredHistory.length;
    
    if (deletedCount > 0) {
      await saveDownloadHistory(filteredHistory);
      logger.info(`🧹 Cleaned up ${deletedCount} old download records`);
    }
    
    return deletedCount;
  } catch (error) {
    logger.error('❌ Failed to cleanup old records', error);
    return 0;
  }
}

/**
 * 加载下载历史文件
 */
async function loadDownloadHistory() {
  try {
    if (!fs.existsSync(DOWNLOAD_HISTORY_FILE)) {
      return [];
    }
    
    const data = fs.readFileSync(DOWNLOAD_HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.warn('⚠️  Failed to load download history, starting with empty history', error);
    return [];
  }
}

/**
 * 保存下载历史文件
 */
async function saveDownloadHistory(history) {
  try {
    const data = JSON.stringify(history, null, 2);
    fs.writeFileSync(DOWNLOAD_HISTORY_FILE, data, 'utf8');
  } catch (error) {
    logger.error('❌ Failed to save download history', error);
    throw error;
  }
}

/**
 * 生成唯一的下载ID
 */
function generateDownloadId() {
  return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}