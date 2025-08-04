/**
 * Centralized Logging Utility
 * 集中式日志记录工具
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[37m', // White
  RESET: '\x1b[0m'
};

class Logger {
  constructor() {
    this.level = this.parseLogLevel(process.env.LOG_LEVEL || 'INFO');
    this.enableColors = process.env.NODE_ENV !== 'production';
  }

  parseLogLevel(level) {
    const upperLevel = level.toUpperCase();
    return LOG_LEVELS[upperLevel] !== undefined ? LOG_LEVELS[upperLevel] : LOG_LEVELS.INFO;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const levelStr = level.padEnd(5);
    
    let formattedMessage = `[${timestamp}] ${levelStr} ${message}`;
    
    if (Object.keys(meta).length > 0) {
      formattedMessage += ` ${JSON.stringify(meta)}`;
    }
    
    if (this.enableColors) {
      const color = LOG_COLORS[level] || LOG_COLORS.RESET;
      return `${color}${formattedMessage}${LOG_COLORS.RESET}`;
    }
    
    return formattedMessage;
  }

  log(level, message, meta = {}) {
    const levelNum = LOG_LEVELS[level];
    
    if (levelNum <= this.level) {
      const formattedMessage = this.formatMessage(level, message, meta);
      
      if (level === 'ERROR') {
        console.error(formattedMessage);
      } else if (level === 'WARN') {
        console.warn(formattedMessage);
      } else {
        console.log(formattedMessage);
      }
    }
  }

  error(message, meta = {}) {
    // 处理Error对象
    if (meta instanceof Error) {
      meta = {
        name: meta.name,
        message: meta.message,
        stack: meta.stack
      };
    }
    this.log('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  // 带有表情符号的便捷方法
  success(message, meta = {}) {
    this.info(`✅ ${message}`, meta);
  }

  failure(message, meta = {}) {
    this.error(`❌ ${message}`, meta);
  }

  progress(message, meta = {}) {
    this.info(`🚀 ${message}`, meta);
  }

  search(message, meta = {}) {
    this.info(`🔍 ${message}`, meta);
  }

  download(message, meta = {}) {
    this.info(`📥 ${message}`, meta);
  }

  cleanup(message, meta = {}) {
    this.info(`🧹 ${message}`, meta);
  }
}

// 创建全局logger实例
export const logger = new Logger();

// 为了兼容性，也导出Logger类
export { Logger };