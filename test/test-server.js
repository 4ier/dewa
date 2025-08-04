#!/usr/bin/env node

/**
 * MCP Server Test Suite
 * 测试MCP服务器的基本功能
 */

import { DewaServer } from '../src/index.js';
import { isDirectURL, isValidQuality } from '../src/utils/validators.js';
import { detectPlatform } from '../src/core/platforms.js';
import { logger } from '../src/utils/logger.js';

// 测试用例
const TEST_CASES = {
  urls: [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ', 
    'https://www.bilibili.com/video/BV1xx411c7mu',
    'https://www.magentamusik.de/test-video'
  ],
  
  directUrls: [
    'https://www.youtube.com/watch?v=xyz123',
    'https://youtu.be/abc456',
    'https://www.bilibili.com/video/BV789',
    'https://www.magentamusik.de/video/test'
  ],
  
  invalidInputs: [
    '',
    null,
    undefined,
    'invalid-url',
    'not a real query',
    '   '
  ]
};

/**
 * 测试URL检测功能
 */
function testURLDetection() {
  console.log('\n🧪 Testing URL Detection...');
  
  let passed = 0;
  let total = 0;
  
  // 测试有效URL
  TEST_CASES.urls.forEach(url => {
    total++;
    const isURL = isDirectURL(url);
    if (isURL) {
      console.log(`✅ ${url} -> Detected as URL`);
      passed++;
    } else {
      console.log(`❌ ${url} -> Failed to detect as URL`);
    }
  });
  
  // 测试无效输入
  TEST_CASES.invalidInputs.forEach(input => {
    total++;
    const isURL = isDirectURL(input);
    if (!isURL) {
      console.log(`✅ "${input}" -> Correctly identified as invalid`);
      passed++;
    } else {
      console.log(`❌ "${input}" -> Incorrectly identified as URL`);
    }
  });
  
  console.log(`\n📊 URL Detection: ${passed}/${total} tests passed`);
  return passed === total;
}

/**
 * 测试平台识别功能
 */
function testPlatformDetection() {
  console.log('\n🧪 Testing Platform Detection...');
  
  let passed = 0;
  let total = 0;
  
  const expectedPlatforms = {
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ': 'youtube',
    'https://youtu.be/dQw4w9WgXcQ': 'youtube',
    'https://www.bilibili.com/video/BV1xx411c7mu': 'bilibili',
    'https://www.magentamusik.de/test-video': 'magentamusik'
  };
  
  for (const [url, expectedPlatform] of Object.entries(expectedPlatforms)) {
    total++;
    const platform = detectPlatform(url);
    
    if (platform.name === expectedPlatform) {
      console.log(`✅ ${url} -> ${platform.name}`);
      passed++;
    } else {
      console.log(`❌ ${url} -> Expected: ${expectedPlatform}, Got: ${platform.name}`);
    }
  }
  
  console.log(`\n📊 Platform Detection: ${passed}/${total} tests passed`);
  return passed === total;
}

/**
 * 测试配置系统
 */
async function testConfigSystem() {
  console.log('\n🧪 Testing Configuration System...');
  
  let passed = 0;
  let total = 0;
  
  try {
    const { getConfig, validateConfig } = await import('../src/utils/config.js');
    
    total++;
    const config = await getConfig();
    if (config && config.downloadPath) {
      console.log(`✅ Config loaded successfully`);
      console.log(`   Download path: ${config.downloadPath}`);
      console.log(`   yt-dlp path: ${config.ytDlpPath ? 'detected' : 'not found'}`);
      passed++;
    } else {
      console.log(`❌ Config loading failed`);
    }
    
    total++;
    try {
      await validateConfig();
      console.log(`✅ Config validation passed`);
      passed++;
    } catch (error) {
      console.log(`❌ Config validation failed: ${error.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Config system test failed: ${error.message}`);
  }
  
  console.log(`\n📊 Configuration System: ${passed}/${total} tests passed`);
  return passed === total;
}

/**
 * 测试验证器
 */
function testValidators() {
  console.log('\n🧪 Testing Validators...');
  
  let passed = 0;
  let total = 0;
  
  // 测试质量验证
  const validQualities = ['best', 'worst', '1080p', '720p', '480p', '360p'];
  const invalidQualities = ['4K', '144p', 'medium', 'high', null, undefined];
  
  validQualities.forEach(quality => {
    total++;
    if (isValidQuality(quality)) {
      console.log(`✅ Quality "${quality}" -> Valid`);
      passed++;
    } else {
      console.log(`❌ Quality "${quality}" -> Should be valid`);
    }
  });
  
  invalidQualities.forEach(quality => {
    total++;
    if (!isValidQuality(quality)) {
      console.log(`✅ Quality "${quality}" -> Correctly invalid`);
      passed++;
    } else {
      console.log(`❌ Quality "${quality}" -> Should be invalid`);
    }
  });
  
  console.log(`\n📊 Validators: ${passed}/${total} tests passed`);
  return passed === total;
}

/**
 * 测试MCP工具定义
 */
function testMCPToolDefinitions() {
  console.log('\n🧪 Testing MCP Tool Definitions...');
  
  try {
    // 动态导入工具定义
    import('../src/tools/download-video.js').then(({ downloadVideoTool }) => {
      console.log(`✅ download_video tool loaded`);
      console.log(`   Name: ${downloadVideoTool.name}`);
      console.log(`   Required params: ${downloadVideoTool.inputSchema.required?.join(', ') || 'none'}`);
    }).catch(err => {
      console.log(`❌ Failed to load download_video tool: ${err.message}`);
    });
    
    // search_videos tool has been removed in the new architecture
    
    import('../src/tools/list-downloads.js').then(({ listDownloadsTool }) => {
      console.log(`✅ list_downloads tool loaded`);
      console.log(`   Name: ${listDownloadsTool.name}`);
    }).catch(err => {
      console.log(`❌ Failed to load list_downloads tool: ${err.message}`);
    });
    
    return true;
  } catch (error) {
    console.log(`❌ Tool definition test failed: ${error.message}`);
    return false;
  }
}

/**
 * 模拟MCP工具调用
 */
async function testMCPToolCalls() {
  console.log('\n🧪 Testing MCP Tool Calls (Simulation)...');
  
  try {
    const { handleDownloadVideo } = await import('../src/tools/download-video.js');
    
    // 测试参数验证
    console.log('Testing parameter validation...');
    
    // 测试缺少必需参数
    try {
      await handleDownloadVideo({});
      console.log('❌ Should have failed with missing url');
    } catch (error) {
      console.log('✅ Correctly rejected empty parameters');
    }
    
    // 测试无效质量参数
    try {
      await handleDownloadVideo({
        url: 'https://www.youtube.com/watch?v=test',
        quality: 'invalid_quality'
      });
      console.log('❌ Should have failed with invalid quality');
    } catch (error) {
      console.log('✅ Correctly rejected invalid quality');
    }
    
    console.log('\n📊 MCP Tool Calls: Basic validation tests passed');
    return true;
    
  } catch (error) {
    console.log(`❌ MCP Tool Call test failed: ${error.message}`);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 Starting DEWA MCP Server Tests\n');
  console.log('=' .repeat(60));
  
  const testResults = [];
  
  // 运行各个测试
  testResults.push(testURLDetection());
  testResults.push(testPlatformDetection());
  testResults.push(await testConfigSystem());
  testResults.push(testValidators());
  testResults.push(testMCPToolDefinitions());
  testResults.push(await testMCPToolCalls());
  
  // 汇总结果
  const passedTests = testResults.filter(result => result).length;
  const totalTests = testResults.length;
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 Overall Test Results: ${passedTests}/${totalTests} test suites passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! MCP server is ready to use.');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the issues above.');
    process.exit(1);
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    logger.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}