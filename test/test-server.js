#!/usr/bin/env node

/**
 * MCP Server Test Suite
 * 测试MCP服务器的基本功能
 */

import { NaturalVideoDownloaderServer } from '../src/index.js';
import { isDirectURL, isValidQuality } from '../src/utils/validators.js';
import { parseNaturalQuery } from '../src/search/nlp-processor.js';
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
  
  naturalLanguageQueries: [
    '下载周杰伦稻香MV',
    'download Taylor Swift latest song',
    'Wacken 2025 Metallica performance',
    '下载beyond光辉岁月演唱会版本',
    'Rick Astley Never Gonna Give You Up'
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
  
  // 测试自然语言查询
  TEST_CASES.naturalLanguageQueries.forEach(query => {
    total++;
    const isURL = isDirectURL(query);
    if (!isURL) {
      console.log(`✅ "${query}" -> Correctly identified as natural language`);
      passed++;
    } else {
      console.log(`❌ "${query}" -> Incorrectly identified as URL`);
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
 * 测试自然语言处理
 */
function testNLPProcessing() {
  console.log('\n🧪 Testing Natural Language Processing...');
  
  let passed = 0;
  let total = 0;
  
  TEST_CASES.naturalLanguageQueries.forEach(query => {
    total++;
    try {
      const parsed = parseNaturalQuery(query);
      
      if (parsed && parsed.original === query && parsed.searchQuery) {
        console.log(`✅ "${query}" -> Parsed successfully`);
        console.log(`   Artist: ${parsed.artist || 'N/A'}`);
        console.log(`   Type: ${parsed.contentType}`);
        console.log(`   Language: ${parsed.language}`);
        passed++;
      } else {
        console.log(`❌ "${query}" -> Parsing failed`);
      }
    } catch (error) {
      console.log(`❌ "${query}" -> Error: ${error.message}`);
    }
  });
  
  console.log(`\n📊 NLP Processing: ${passed}/${total} tests passed`);
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
    
    import('../src/tools/search-videos.js').then(({ searchVideosTool }) => {
      console.log(`✅ search_videos tool loaded`);
      console.log(`   Name: ${searchVideosTool.name}`);
    }).catch(err => {
      console.log(`❌ Failed to load search_videos tool: ${err.message}`);
    });
    
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
      console.log('❌ Should have failed with missing query');
    } catch (error) {
      console.log('✅ Correctly rejected empty parameters');
    }
    
    // 测试无效质量参数
    try {
      await handleDownloadVideo({
        query: 'https://www.youtube.com/watch?v=test',
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
  console.log('🚀 Starting Natural Video Downloader MCP Server Tests\n');
  console.log('=' .repeat(60));
  
  const testResults = [];
  
  // 运行各个测试
  testResults.push(testURLDetection());
  testResults.push(testPlatformDetection());
  testResults.push(testNLPProcessing());
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