/**
 * List Downloads MCP Tool
 * 列出下载历史和当前状态
 */

import { z } from 'zod';
import { getDownloadHistory, getCurrentDownloads } from '../core/download-manager.js';
import { formatFileSize, formatDate } from '../utils/formatters.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

// 工具参数验证schema
const ListDownloadsArgsSchema = z.object({
  status: z.enum(['all', 'completed', 'failed', 'in_progress']).default('all'),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.enum(['date', 'name', 'size', 'platform']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  platform: z.enum(['youtube', 'bilibili', 'all']).default('all')
});

// MCP工具定义
export const listDownloadsTool = {
  name: 'list_downloads',
  description: `
List download history and current download status.

Features:
- View completed, failed, and in-progress downloads
- Filter by platform, status, or date
- Sort by various criteria
- Show file sizes and download times
- Display download statistics

Useful for:
- Checking download history
- Finding previously downloaded videos
- Monitoring current download progress
- Managing downloaded files
  `,
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['all', 'completed', 'failed', 'in_progress'],
        default: 'all',
        description: 'Filter downloads by status'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Maximum number of downloads to show'
      },
      sort_by: {
        type: 'string',
        enum: ['date', 'name', 'size', 'platform'],
        default: 'date',
        description: 'Sort downloads by field'
      },
      sort_order: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc',
        description: 'Sort order'
      },
      platform: {
        type: 'string',
        enum: ['youtube', 'bilibili', 'all'],
        default: 'all',
        description: 'Filter by platform'
      }
    },
    required: []
  }
};

/**
 * 处理列出下载工具调用
 */
export async function handleListDownloads(args) {
  try {
    // 验证参数
    const validatedArgs = ListDownloadsArgsSchema.parse(args);
    const { status, limit, sort_by, sort_order, platform } = validatedArgs;

    logger.info('📋 Processing list downloads request', { status, limit, sort_by, platform });

    // 获取下载历史和当前状态
    const [history, currentDownloads] = await Promise.all([
      getDownloadHistory({ status, platform, limit, sort_by, sort_order }),
      getCurrentDownloads()
    ]);

    let resultText = `📥 下载管理器\n\n`;

    // 显示当前进行中的下载
    if (currentDownloads && currentDownloads.length > 0) {
      resultText += `🚀 **当前下载中** (${currentDownloads.length})\n`;
      currentDownloads.forEach((download, index) => {
        resultText += `${index + 1}. ${download.title || 'Unknown'}\n`;
        resultText += `   📊 进度: ${download.progress || '0%'}\n`;
        resultText += `   🏷️  平台: ${download.platform || 'Unknown'}\n`;
        resultText += `   📁 目录: ${download.output_dir || 'Unknown'}\n\n`;
      });
    }

    // 显示历史记录
    if (history && history.length > 0) {
      const statusEmojis = {
        completed: '✅',
        failed: '❌',
        in_progress: '🚀'
      };

      resultText += `📚 **下载历史** (显示 ${history.length} 条记录)\n`;
      resultText += `筛选: ${status === 'all' ? '全部状态' : status} | 平台: ${platform === 'all' ? '全部平台' : platform}\n\n`;

      history.forEach((item, index) => {
        const statusEmoji = statusEmojis[item.status] || '❓';
        resultText += `${statusEmoji} **${index + 1}. ${item.title}**\n`;
        resultText += `   🔗 URL: ${item.url}\n`;
        resultText += `   🏷️  平台: ${item.platform?.toUpperCase() || 'Unknown'}\n`;
        resultText += `   📅 时间: ${formatDate(item.download_time)}\n`;
        
        if (item.status === 'completed') {
          resultText += `   📁 路径: ${item.file_path}\n`;
          if (item.file_size) {
            resultText += `   💾 大小: ${item.file_size}\n`;
          }
        } else if (item.status === 'failed') {
          resultText += `   ❌ 错误: ${item.error_message || 'Unknown error'}\n`;
        }
        
        if (item.metadata?.duration) {
          resultText += `   ⏱️  时长: ${item.metadata.duration}\n`;
        }
        if (item.metadata?.uploader) {
          resultText += `   👤 作者: ${item.metadata.uploader}\n`;
        }
        
        resultText += '\n';
      });

      // 统计信息
      const stats = calculateStats(history);
      resultText += `📊 **统计信息**\n`;
      resultText += `   ✅ 成功: ${stats.completed}\n`;
      resultText += `   ❌ 失败: ${stats.failed}\n`;
      resultText += `   🚀 进行中: ${stats.in_progress}\n`;
      resultText += `   💾 总大小: ${stats.total_size}\n`;
      resultText += `   🎬 YouTube: ${stats.youtube}\n`;
      resultText += `   📺 Bilibili: ${stats.bilibili}\n`;
      
    } else {
      resultText += `📭 **暂无下载记录**\n\n`;
      resultText += `使用 download_video 工具开始下载视频吧！\n`;
      resultText += `示例: download_video("https://www.youtube.com/watch?v=dQw4w9WgXcQ")`;
    }

    return {
      content: [{
        type: 'text',
        text: resultText
      }],
      isError: false
    };

  } catch (error) {
    logger.error('💥 List downloads tool execution failed:', error);
    
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return {
        content: [{
          type: 'text',
          text: `❌ 参数验证失败: ${errorDetails}`
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: 'text',
        text: `❌ 获取下载列表失败: ${error.message}\n\n这可能是数据文件损坏或权限问题。`
      }],
      isError: true
    };
  }
}

/**
 * 计算下载统计信息
 */
function calculateStats(history) {
  const stats = {
    completed: 0,
    failed: 0,
    in_progress: 0,
    total_size: 0,
    youtube: 0,
    bilibili: 0,
    other: 0
  };

  history.forEach(item => {
    // 状态统计
    if (item.status === 'completed') stats.completed++;
    else if (item.status === 'failed') stats.failed++;
    else if (item.status === 'in_progress') stats.in_progress++;

    // 平台统计
    if (item.platform === 'youtube') stats.youtube++;
    else if (item.platform === 'bilibili') stats.bilibili++;
    else stats.other++;

    // 大小统计（仅计算已完成的）
    if (item.status === 'completed' && item.file_path) {
      try {
        const stat = fs.statSync(item.file_path);
        stats.total_size += stat.size;
      } catch (e) {
        // 文件可能已被删除，忽略
      }
    }
  });

  // 格式化总大小
  stats.total_size = formatFileSize(stats.total_size);

  return stats;
}