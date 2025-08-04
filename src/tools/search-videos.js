/**
 * Search Videos MCP Tool
 * 搜索视频但不下载，返回候选列表
 */

import { z } from 'zod';
import { searchVideos } from '../search/web-search.js';
import { parseNaturalQuery } from '../search/nlp-processor.js';
import { logger } from '../utils/logger.js';

// 工具参数验证schema
const SearchVideosArgsSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  platform: z.enum(['youtube', 'bilibili', 'any']).default('any'),
  limit: z.number().int().min(1).max(20).default(5),
  include_metadata: z.boolean().default(true)
});

// MCP工具定义
export const searchVideosTool = {
  name: 'search_videos',
  description: `
Search for videos without downloading them. Returns a list of candidate videos with metadata.

Useful for:
- Previewing search results before downloading
- Finding specific videos by description
- Comparing multiple video options
- Getting video information and URLs

Examples:
- "Taylor Swift latest music video"
- "Wacken Open Air 2025 performances"
- "周杰伦 稻香 官方MV"
  `,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query in natural language'
      },
      platform: {
        type: 'string',
        enum: ['youtube', 'bilibili', 'any'],
        default: 'any',
        description: 'Platform to search on'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 20,
        default: 5,
        description: 'Maximum number of results to return'
      },
      include_metadata: {
        type: 'boolean',
        default: true,
        description: 'Include video metadata (duration, views, etc.)'
      }
    },
    required: ['query']
  }
};

/**
 * 处理搜索视频工具调用
 */
export async function handleSearchVideos(args) {
  try {
    // 验证参数
    const validatedArgs = SearchVideosArgsSchema.parse(args);
    const { query, platform, limit, include_metadata } = validatedArgs;

    logger.info('🔍 Processing search request', { query, platform, limit });

    // 解析自然语言查询
    const parsedQuery = parseNaturalQuery(query);
    logger.info('📝 Parsed search query:', parsedQuery);

    // 执行搜索
    const searchResults = await searchVideos(parsedQuery, platform, limit);

    if (!searchResults || searchResults.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `🔍 未找到匹配的视频

搜索查询: "${query}"
搜索平台: ${platform}

建议:
- 尝试使用更通用的关键词
- 检查拼写是否正确
- 尝试不同的语言（中文/英文）
- 扩大搜索范围（选择 "any" 平台）`
        }],
        isError: false
      };
    }

    // 格式化搜索结果
    let resultText = `🔍 找到 ${searchResults.length} 个视频结果\n\n`;
    
    searchResults.forEach((result, index) => {
      resultText += `**${index + 1}. ${result.title}**\n`;
      resultText += `🔗 URL: ${result.url}\n`;
      resultText += `🏷️  平台: ${result.platform.toUpperCase()}\n`;
      
      if (include_metadata && result.metadata) {
        const meta = result.metadata;
        if (meta.duration) resultText += `⏱️  时长: ${meta.duration}\n`;
        if (meta.uploader) resultText += `👤 上传者: ${meta.uploader}\n`;
        if (meta.view_count) resultText += `👀 观看数: ${meta.view_count}\n`;
        if (meta.upload_date) resultText += `📅 上传时间: ${meta.upload_date}\n`;
        if (meta.description) {
          const shortDesc = meta.description.length > 100 
            ? meta.description.substring(0, 100) + '...'
            : meta.description;
          resultText += `📝 描述: ${shortDesc}\n`;
        }
      }
      
      resultText += '\n';
    });

    resultText += `\n💡 提示: 要下载其中任何一个视频，请使用 download_video 工具并提供相应的URL。`;

    return {
      content: [{
        type: 'text',
        text: resultText
      }],
      isError: false
    };

  } catch (error) {
    logger.error('💥 Search tool execution failed:', error);
    
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
        text: `❌ 搜索失败: ${error.message}\n\n这可能是搜索服务暂时不可用，请稍后重试。`
      }],
      isError: true
    };
  }
}