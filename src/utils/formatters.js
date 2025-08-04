/**
 * Formatting Utilities
 * 格式化工具函数
 */

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
 * 格式化日期时间
 */
export function formatDate(dateInput) {
  if (!dateInput) return 'Unknown';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Unknown';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return formatDate(dateInput);
}

/**
 * 格式化时长
 */
export function formatDuration(durationInput) {
  if (!durationInput) return 'Unknown';
  
  // 如果已经是格式化的字符串，直接返回
  if (typeof durationInput === 'string' && durationInput.includes(':')) {
    return durationInput;
  }
  
  // 如果是秒数，转换为 MM:SS 或 HH:MM:SS 格式
  if (typeof durationInput === 'number') {
    const hours = Math.floor(durationInput / 3600);
    const minutes = Math.floor((durationInput % 3600) / 60);
    const seconds = durationInput % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  return durationInput.toString();
}

/**
 * 格式化数字（添加千位分隔符）
 */
export function formatNumber(num) {
  if (!num || isNaN(num)) return '0';
  
  return num.toLocaleString('zh-CN');
}

/**
 * 格式化观看数
 */
export function formatViewCount(views) {
  if (!views || isNaN(views)) return 'Unknown';
  
  const num = parseInt(views, 10);
  
  if (num < 1000) return num.toString();
  if (num < 10000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 100000) return `${Math.floor(num / 1000)}K`;
  if (num < 1000000) return `${(num / 10000).toFixed(1)}万`;
  if (num < 100000000) return `${Math.floor(num / 10000)}万`;
  
  return `${(num / 100000000).toFixed(1)}亿`;
}

/**
 * 格式化下载进度
 */
export function formatProgress(current, total) {
  if (!current || !total || total === 0) return '0%';
  
  const percentage = (current / total * 100).toFixed(1);
  return `${percentage}%`;
}

/**
 * 格式化下载速度
 */
export function formatSpeed(bytesPerSecond) {
  if (!bytesPerSecond || bytesPerSecond === 0) return '0 B/s';
  
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(1024));
  const speed = (bytesPerSecond / Math.pow(1024, i)).toFixed(2);
  
  return `${speed} ${units[i]}`;
}

/**
 * 格式化状态标签
 */
export function formatStatus(status) {
  const statusMap = {
    'completed': '✅ 已完成',
    'failed': '❌ 失败',
    'in_progress': '🚀 下载中',
    'pending': '⏳ 等待中',
    'cancelled': '⚠️ 已取消',
    'already_exists': '📁 已存在'
  };
  
  return statusMap[status] || `❓ ${status}`;
}

/**
 * 格式化平台名称
 */
export function formatPlatform(platform) {
  const platformMap = {
    'youtube': 'YouTube',
    'bilibili': 'Bilibili',
    'magentamusik': 'MagentaMusik',
    'vimeo': 'Vimeo',
    'twitch': 'Twitch'
  };
  
  return platformMap[platform] || platform.toUpperCase();
}

/**
 * 截断长文本
 */
export function truncateText(text, maxLength = 100, suffix = '...') {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 格式化错误消息
 */
export function formatError(error) {
  if (!error) return 'Unknown error';
  
  if (typeof error === 'string') return error;
  
  if (error.message) return error.message;
  
  return JSON.stringify(error);
}

/**
 * 格式化URL（隐藏查询参数）
 */
export function formatURL(url, hideParams = true) {
  if (!url) return 'Invalid URL';
  
  try {
    const urlObj = new URL(url);
    
    if (hideParams) {
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    }
    
    return url;
  } catch {
    return url;
  }
}