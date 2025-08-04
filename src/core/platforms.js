/**
 * Platform Detection and Configuration
 * 平台识别和配置管理
 */

// 平台配置映射
const PLATFORM_CONFIG = {
  'youtube.com': {
    name: 'youtube',
    displayName: 'YouTube',
    directory: 'youtube',
    prefix: ''
  },
  'youtu.be': {
    name: 'youtube',
    displayName: 'YouTube',
    directory: 'youtube',
    prefix: ''
  },
  'bilibili.com': {
    name: 'bilibili',
    displayName: 'Bilibili',
    directory: 'bilibili',
    prefix: 'B站-'
  },
  'magentamusik.de': {
    name: 'magentamusik',
    displayName: 'MagentaMusik',
    directory: 'magentamusik',
    prefix: ''
  },
  'vimeo.com': {
    name: 'vimeo',
    displayName: 'Vimeo',
    directory: 'vimeo',
    prefix: ''
  },
  'twitch.tv': {
    name: 'twitch',
    displayName: 'Twitch',
    directory: 'twitch',
    prefix: 'Twitch-'
  }
};

// 默认平台配置
const DEFAULT_PLATFORM = {
  name: 'unknown',
  displayName: 'Unknown',
  directory: 'downloads',
  prefix: ''
};

/**
 * 从URL检测视频平台
 */
export function detectPlatform(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // 移除 'www.' 前缀
    const cleanHostname = hostname.replace(/^www\./, '');
    
    // 查找匹配的平台配置
    for (const [domain, config] of Object.entries(PLATFORM_CONFIG)) {
      if (cleanHostname.includes(domain) || hostname.includes(domain)) {
        return {
          ...config,
          domain: cleanHostname,
          url: url
        };
      }
    }
    
    // 返回默认配置
    return {
      ...DEFAULT_PLATFORM,
      domain: cleanHostname,
      url: url
    };
    
  } catch (error) {
    // URL解析失败，返回默认配置
    return {
      ...DEFAULT_PLATFORM,
      domain: 'invalid',
      url: url
    };
  }
}

/**
 * 获取平台特定的质量偏好
 */
export function getPlatformQuality(platformName, requestedQuality = 'best') {
  const qualityMappings = {
    youtube: {
      'best': 'best[height<=1080]',
      '1080p': 'best[height<=1080]',
      '720p': 'best[height<=720]',
      '480p': 'best[height<=480]',
      '360p': 'best[height<=360]',
      'worst': 'worst'
    },
    bilibili: {
      'best': 'best',
      '1080p': 'best[height<=1080]',
      '720p': 'best[height<=720]',
      '480p': 'best[height<=480]',
      '360p': 'best[height<=360]',
      'worst': 'worst'
    },
    // 其他平台使用通用映射
    default: {
      'best': 'best',
      '1080p': 'best[height<=1080]',
      '720p': 'best[height<=720]',
      '480p': 'best[height<=480]',
      '360p': 'best[height<=360]',
      'worst': 'worst'
    }
  };
  
  const platformQualities = qualityMappings[platformName] || qualityMappings.default;
  return platformQualities[requestedQuality] || platformQualities['best'];
}

/**
 * 获取平台特定的搜索提示
 */
export function getPlatformSearchHints(platformName) {
  const hints = {
    youtube: [
      '使用英文关键词通常能找到更多结果',
      '添加 "official" 或 "MV" 可以找到官方视频',
      '使用艺术家名 + 歌曲名的组合效果最好'
    ],
    bilibili: [
      '中文关键词在B站搜索效果更好',
      '可以尝试添加 "官方" 或 "高清" 等关键词',
      'UP主名称 + 内容标题的组合很有效'
    ],
    default: [
      '使用具体的关键词组合',
      '避免过于通用的搜索词',
      '可以尝试不同语言的关键词'
    ]
  };
  
  return hints[platformName] || hints.default;
}

/**
 * 验证URL是否为支持的平台
 */
export function isSupportedPlatform(url) {
  const platform = detectPlatform(url);
  return platform.name !== 'unknown';
}

/**
 * 获取所有支持的平台列表
 */
export function getSupportedPlatforms() {
  return Object.values(PLATFORM_CONFIG).map(config => ({
    name: config.name,
    displayName: config.displayName,
    directory: config.directory
  }));
}

/**
 * 根据平台名称获取配置
 */
export function getPlatformConfig(platformName) {
  for (const config of Object.values(PLATFORM_CONFIG)) {
    if (config.name === platformName) {
      return config;
    }
  }
  return DEFAULT_PLATFORM;
}