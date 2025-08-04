/**
 * Download Video MCP Tool
 * 视频下载工具 - 接收URL进行下载
 */

import { z } from 'zod';
import { downloadVideo } from '../core/downloader.js';
import { isDirectURL } from '../utils/validators.js';
import { logger } from '../utils/logger.js';

// 工具参数验证schema
const DownloadVideoArgsSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  quality: z.enum(['best', 'worst', '720p', '1080p', '480p', '360p']).default('best'),
  custom_directory: z.string().optional(),
  custom_filename: z.string().optional(),
});

// MCP工具定义
export const downloadVideoTool = {
  name: 'download_video',
  description: `
Download videos from supported platforms using direct URLs.

Features:
- Direct URL download from YouTube, Bilibili, and other platforms
- Configurable video quality
- Custom download directory and filename
- Resume interrupted downloads
- Automatic fragment cleanup

Examples:
- YouTube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
- YouTube Short: "https://youtu.be/abc123"
- Bilibili: "https://www.bilibili.com/video/BV1xx411c7mu"
  `,
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Video URL to download'
      },
      quality: {
        type: 'string',
        enum: ['best', 'worst', '720p', '1080p', '480p', '360p'],
        default: 'best',
        description: 'Video quality preference'
      },
      custom_directory: {
        type: 'string',
        description: 'Custom download directory (optional, auto-organized by default)'
      },
      custom_filename: {
        type: 'string',
        description: 'Custom filename (optional, auto-generated from video title by default)'
      }
    },
    required: ['url']
  }
};

/**
 * 处理下载视频工具调用
 */
export async function handleDownloadVideo(args) {
  try {
    // 验证参数
    const validatedArgs = DownloadVideoArgsSchema.parse(args);
    const { url, quality, custom_directory, custom_filename } = validatedArgs;

    logger.info('🎬 Processing download request', { url, quality });

    // 验证URL格式
    if (!isDirectURL(url)) {
      return {
        content: [{
          type: 'text',
          text: `❌ 无效的URL格式\n\n请提供有效的视频URL，例如:\n- https://www.youtube.com/watch?v=xxx\n- https://www.bilibili.com/video/BVxxx`
        }],
        isError: true
      };
    }

    // 执行下载
    logger.info('📥 Starting download:', url);
    const downloadResult = await downloadVideo({
      url,
      quality,
      customDirectory: custom_directory,
      customFilename: custom_filename
    });

    if (downloadResult.success) {
      const result = downloadResult.data;
      
      return {
        content: [{
          type: 'text',
          text: `✅ 视频下载成功！

📺 标题: ${result.title}
🏷️  平台: ${result.platform}
💾 文件路径: ${result.file_path}
📊 文件大小: ${result.file_size}
⏱️  下载时间: ${result.download_time}
🎯 质量: ${quality}

${result.metadata?.duration ? `⏳ 时长: ${result.metadata.duration}` : ''}
${result.metadata?.uploader ? `👤 上传者: ${result.metadata.uploader}` : ''}
`
        }],
        isError: false
      };
    } else {
      logger.error('💥 Download failed:', downloadResult.error);
      
      return {
        content: [{
          type: 'text',
          text: `❌ 下载失败: ${downloadResult.error.message}\n\nURL: ${url}\n\n请检查:\n1. 网络连接是否正常\n2. 视频URL是否有效\n3. 是否有足够的磁盘空间\n4. 视频是否有地区限制`
        }],
        isError: true
      };
    }

  } catch (error) {
    logger.error('💥 Tool execution failed:', error);
    
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
        text: `❌ 工具执行失败: ${error.message}\n\n这可能是一个内部错误，请稍后重试或报告此问题。`
      }],
      isError: true
    };
  }
}