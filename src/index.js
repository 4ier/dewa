#!/usr/bin/env node

/**
 * Natural Video Downloader MCP Server
 * 支持自然语言和URL的智能视频下载服务
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 导入工具模块
import { downloadVideoTool, handleDownloadVideo } from './tools/download-video.js';
import { searchVideosTool, handleSearchVideos } from './tools/search-videos.js';
import { listDownloadsTool, handleListDownloads } from './tools/list-downloads.js';
import { logger } from './utils/logger.js';
import { validateConfig } from './utils/config.js';

// 服务器配置
const SERVER_INFO = {
  name: 'dewa',
  version: '1.0.0',
  description: 'DEWA - Download Everything With AI using MCP integration',
  author: '4ier',
  homepage: 'https://github.com/4ier/dewa'
};

// 支持的工具列表
const TOOLS = [
  downloadVideoTool,
  searchVideosTool,
  listDownloadsTool
];

class NaturalVideoDownloaderServer {
  constructor() {
    this.server = new Server(SERVER_INFO, {
      capabilities: {
        tools: {},
      },
    });
    
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    // 列出所有可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info('📋 Client requested tools list');
      return {
        tools: TOOLS
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      logger.info(`🔧 Tool called: ${name}`, { args });

      try {
        switch (name) {
          case 'download_video':
            return await handleDownloadVideo(args || {});
            
          case 'search_videos':
            return await handleSearchVideos(args || {});
            
          case 'list_downloads':
            return await handleListDownloads(args || {});
            
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        logger.error(`❌ Tool execution failed: ${name}`, error);
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  setupErrorHandling() {
    // 全局错误处理
    this.server.onerror = (error) => {
      logger.error('💥 Server error:', error);
    };

    // 进程错误处理
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // 优雅关闭
    process.on('SIGINT', () => {
      logger.info('🛑 Received SIGINT, gracefully shutting down...');
      this.close();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('🛑 Received SIGTERM, gracefully shutting down...');
      this.close();
      process.exit(0);
    });
  }

  async start() {
    try {
      // 验证配置
      validateConfig();
      
      // 创建传输层
      const transport = new StdioServerTransport();
      
      // 连接服务器和传输层
      await this.server.connect(transport);
      
      logger.info('🚀 DEWA MCP Server started');
      logger.info(`📋 Available tools: ${TOOLS.map(t => t.name).join(', ')}`);
      logger.info(`📁 Download path: ${process.env.DOWNLOAD_PATH || '/tmp'}`);
      
    } catch (error) {
      logger.error('💥 Failed to start server:', error);
      process.exit(1);
    }
  }

  async close() {
    try {
      await this.server.close();
      logger.info('✅ Server closed gracefully');
    } catch (error) {
      logger.error('❌ Error closing server:', error);
    }
  }
}

// 启动服务器
async function main() {
  try {
    const server = new NaturalVideoDownloaderServer();
    await server.start();
  } catch (error) {
    logger.error('💥 Failed to start DEWA MCP Server:', error);
    process.exit(1);
  }
}

// 只在直接运行时启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { NaturalVideoDownloaderServer, SERVER_INFO, TOOLS };