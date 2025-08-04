/**
 * Natural Language Processing
 * 自然语言处理模块 - 基础实现
 */

import { logger } from '../utils/logger.js';

/**
 * 解析自然语言查询
 */
export function parseNaturalQuery(query) {
  logger.info('💬 Parsing natural language query', { query });
  
  const parsed = {
    original: query,
    artist: null,
    title: null,
    contentType: 'video',
    language: detectLanguage(query),
    keywords: extractKeywords(query),
    searchQuery: query.trim()
  };
  
  // 提取艺术家信息
  parsed.artist = extractArtist(query);
  
  // 提取标题信息
  parsed.title = extractTitle(query);
  
  // 识别内容类型
  parsed.contentType = inferContentType(query);
  
  // 构建优化的搜索查询
  parsed.searchQuery = buildOptimizedQuery(parsed);
  
  logger.info('📝 Query parsed', parsed);
  
  return parsed;
}

/**
 * 检测查询语言
 */
function detectLanguage(query) {
  // 简单的语言检测
  const chinesePattern = /[\u4e00-\u9fff]/;
  const englishPattern = /[a-zA-Z]/;
  
  if (chinesePattern.test(query)) {
    return 'zh';
  } else if (englishPattern.test(query)) {
    return 'en';
  }
  
  return 'unknown';
}

/**
 * 提取艺术家名称
 */
function extractArtist(query) {
  const patterns = [
    // 中文模式
    /(.+?)的(?:歌|MV|音乐|演唱会|现场)/i,
    /(.+?)(?:\s|-)(?:歌曲|音乐|MV)/i,
    
    // 英文模式
    /(.+?)\s(?:song|music|mv|video|live|performance)/i,
    /(.+?)\s-\s(.+)/i,  // "Artist - Song" 格式
    
    // 通用模式
    /^(.+?)\s/  // 第一个词作为艺术家
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      const artist = match[1].trim();
      if (artist.length > 1 && artist.length < 50) {
        return artist;
      }
    }
  }
  
  return null;
}

/**
 * 提取歌曲/视频标题
 */
function extractTitle(query) {
  const patterns = [
    // "Artist - Title" 格式 
    /.+?\s-\s(.+)/i,
    
    // 引号中的标题
    /["'](.+?)["']/i,
    
    // 中文 "的" 后面的内容
    /.+?的(.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      if (title.length > 1 && title.length < 100) {
        return title;
      }
    }
  }
  
  return null;
}

/**
 * 推断内容类型
 */
function inferContentType(query) {
  const typeMap = {
    'mv': ['mv', 'music video', '音乐视频', 'official video'],
    'live': ['live', 'concert', '演唱会', '现场', 'performance'],
    'cover': ['cover', '翻唱', '翻唱版'],
    'karaoke': ['karaoke', 'ktv', '卡拉ok'],
    'remix': ['remix', '混音', 'mix'],
    'acoustic': ['acoustic', '原声', '不插电'],
    'tutorial': ['tutorial', '教程', 'how to', '教学']
  };
  
  const lowerQuery = query.toLowerCase();
  
  for (const [type, keywords] of Object.entries(typeMap)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return type;
      }
    }
  }
  
  return 'video';
}

/**
 * 提取关键词
 */
function extractKeywords(query) {
  // 移除常见的停用词
  const stopWords = [
    // 英文停用词
    'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'by',
    'download', 'watch', 'video', 'song', 'music',
    
    // 中文停用词  
    '的', '和', '与', '或', '下载', '观看', '视频', '歌曲', '音乐'
  ];
  
  const words = query
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')  // 保留字母、数字、中文和空格
    .split(/\s+/)
    .filter(word => 
      word.length > 1 && 
      !stopWords.includes(word) &&
      !word.match(/^\d+$/)  // 排除纯数字
    );
  
  return [...new Set(words)];  // 去重
}

/**
 * 构建优化的搜索查询
 */
function buildOptimizedQuery(parsed) {
  let query = parsed.original;
  
  // 如果有艺术家和标题，构建 "Artist Title" 格式
  if (parsed.artist && parsed.title) {
    query = `${parsed.artist} ${parsed.title}`;
  }
  
  // 根据内容类型添加关键词
  const typeKeywords = {
    'mv': 'official music video',
    'live': 'live performance',
    'cover': 'cover version',
    'karaoke': 'karaoke version'
  };
  
  if (typeKeywords[parsed.contentType]) {
    query += ` ${typeKeywords[parsed.contentType]}`;
  }
  
  return query.trim();
}

/**
 * 分析查询意图
 */
export function analyzeIntent(query) {
  const intents = {
    download: /(?:下载|download)/i.test(query),
    search: /(?:搜索|search|find)/i.test(query),
    latest: /(?:最新|latest|new|recent)/i.test(query),
    official: /(?:官方|official)/i.test(query),
    highQuality: /(?:高清|hd|1080p|720p|high quality)/i.test(query)
  };
  
  return intents;
}

/**
 * 提取时间相关信息
 */
export function extractTimeReferences(query) {
  const timePatterns = {
    year: /(?:19|20)\d{2}/g,
    recent: /(?:最近|recent|latest|new)/i,
    old: /(?:老|classic|vintage|old)/i
  };
  
  const timeInfo = {};
  
  for (const [key, pattern] of Object.entries(timePatterns)) {
    const matches = query.match(pattern);
    if (matches) {
      timeInfo[key] = matches;
    }
  }
  
  return timeInfo;
}