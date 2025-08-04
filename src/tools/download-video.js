/**
 * Download Video MCP Tool
 * 支持URL直下和自然语言搜索下载
 */

import { z } from 'zod';
import { downloadVideo } from '../core/downloader.js';
import { searchAndSelectBest } from '../search/web-search.js';
import { parseNaturalQuery } from '../search/nlp-processor.js';
import { isDirectURL } from '../utils/validators.js';
import { logger } from '../utils/logger.js';

// 工具参数验证schema
const DownloadVideoArgsSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  platform_preference: z.enum(['youtube', 'bilibili', 'any']).default('any'),
  quality: z.enum(['best', 'worst', '720p', '1080p', '480p', '360p']).default('best'),
  custom_directory: z.string().optional(),
  custom_filename: z.string().optional(),
});

// MCP工具定义
export const downloadVideoTool = {
  name: 'download_video',
  description: `
Download videos from URLs or search and download based on natural language queries.

Features:
- Direct URL download from YouTube, Bilibili, and other platforms
- Natural language search: "download Taylor Swift latest MV", "周杰伦稻香"
- Intelligent file naming and directory organization
- Resume interrupted downloads
- Automatic fragment cleanup

Examples:
- Direct: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
- Search: "download Wacken 2025 Metallica performance"
- Chinese: "下载周杰伦稻香MV"
  `,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Video URL (for direct download) or natural language search query'
      },
      platform_preference: {
        type: 'string',
        enum: ['youtube', 'bilibili', 'any'],
        default: 'any',
        description: 'Preferred video platform for search results'
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
    required: ['query']
  }
};

/**
 * 处理下载视频工具调用
 */
export async function handleDownloadVideo(args) {
  try {
    // 验证参数
    const validatedArgs = DownloadVideoArgsSchema.parse(args);
    const { query, platform_preference, quality, custom_directory, custom_filename } = validatedArgs;

    logger.info('🎬 Processing download request', { query, platform_preference, quality });

    let downloadURL = query;
    let videoMetadata = {};

    // 判断是直接URL还是自然语言查询
    if (isDirectURL(query)) {
      logger.info('🔗 Direct URL detected, proceeding with download');
    } else {
      logger.info('💬 Natural language query detected, searching for videos');
      
      try {
        // 解析自然语言查询
        const parsedQuery = parseNaturalQuery(query);
        logger.info('📝 Parsed query:', parsedQuery);

        // 执行web搜索
        const searchResults = await searchAndSelectBest(parsedQuery, platform_preference);
        
        if (!searchResults || searchResults.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `❌ 未找到匹配的视频\n\n搜索查询: "${query}"\n平台偏好: ${platform_preference}\n\n请尝试:\n1. 使用更具体的关键词\n2. 提供直接的视频URL\n3. 尝试不同的平台偏好`
            }],
            isError: false
          };
        }

        const bestResult = searchResults[0];
        downloadURL = bestResult.url;
        videoMetadata = bestResult.metadata || {};
        
        logger.info('🎯 Selected best match:', { 
          title: videoMetadata.title,
          platform: videoMetadata.platform,
          url: downloadURL 
        });
        
      } catch (searchError) {
        logger.error('🔍 Search failed:', searchError);
        return {
          content: [{
            type: 'text',
            text: `❌ 搜索失败: ${searchError.message}\n\n请尝试提供直接的视频URL，或检查网络连接和搜索服务配置。`
          }],
          isError: true
        };
      }
    }

    // 执行下载
    logger.info('📥 Starting download:', downloadURL);
    const downloadResult = await downloadVideo({
      url: downloadURL,
      quality,
      customDirectory: custom_directory,
      customFilename: custom_filename,
      metadata: videoMetadata
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
          text: `❌ 下载失败: ${downloadResult.error.message}\n\n查询: "${query}"\nURL: ${downloadURL}\n\n请检查:\n1. 网络连接是否正常\n2. 视频URL是否有效\n3. 是否有足够的磁盘空间\n4. 视频是否有地区限制`
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