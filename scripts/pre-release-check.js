#!/usr/bin/env node

/**
 * Pre-Release Quality Check Script
 * 发布前代码质量检查工具
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 检查结果
const results = {
  passed: [],
  warnings: [],
  errors: []
};

/**
 * 递归遍历目录
 */
function walkDir(dir, callback, ignore = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // 忽略特定目录
    if (ignore.some(pattern => filePath.includes(pattern))) {
      return;
    }
    
    if (stat.isDirectory()) {
      walkDir(filePath, callback, ignore);
    } else {
      callback(filePath);
    }
  });
}

/**
 * 读取文件内容
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * 检查遗留代码引用
 */
function checkLegacyReferences() {
  console.log(`\n${colors.blue}🔍 Checking for legacy code references...${colors.reset}`);
  
  const legacyPatterns = [
    { pattern: /wacken/gi, name: 'Wacken project references' },
    { pattern: /natural-video-downloader/gi, name: 'Old project name' },
    { pattern: /NaturalVideoDownloaderServer/g, name: 'Old server class name' },
    { pattern: /search-videos/g, name: 'Removed search functionality' },
    { pattern: /nlp-processor/g, name: 'Removed NLP module' },
    { pattern: /parseNaturalQuery/g, name: 'Removed NLP function' },
    { pattern: /\/mnt\/share.*\/codebase\//g, name: 'Hardcoded paths' }
  ];
  
  let issuesFound = false;
  
  walkDir(PROJECT_ROOT, (filePath) => {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.json') && !filePath.endsWith('.md')) {
      return;
    }
    
    const content = readFile(filePath);
    if (!content) return;
    
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    
    legacyPatterns.forEach(({ pattern, name }) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        // 忽略这个检查脚本本身
        if (relativePath === 'scripts/pre-release-check.js') {
          return;
        }
        
        issuesFound = true;
        results.errors.push({
          file: relativePath,
          issue: `Found ${matches.length} instance(s) of ${name}`,
          matches: [...new Set(matches)]
        });
      }
    });
  }, ['node_modules', '.git', 'test-reports']);
  
  if (!issuesFound) {
    results.passed.push('No legacy code references found');
  }
}

/**
 * 检查版本一致性
 */
function checkVersionConsistency() {
  console.log(`\n${colors.blue}🔍 Checking version consistency...${colors.reset}`);
  
  const packageJson = JSON.parse(readFile(path.join(PROJECT_ROOT, 'package.json')));
  const currentVersion = packageJson.version;
  
  const filesToCheck = [
    {
      path: 'src/index.js',
      pattern: /version:\s*['"]([^'"]+)['"]/
    },
    {
      path: 'package.json',
      patterns: [
        { key: 'version', pattern: /"version":\s*"([^"]+)"/ },
        { key: 'mcp.server.version', pattern: /"version":\s*"([^"]+)".*mcp.*server/s }
      ]
    }
  ];
  
  let allVersionsMatch = true;
  
  filesToCheck.forEach(({ path: filePath, pattern, patterns }) => {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    const content = readFile(fullPath);
    
    if (!content) {
      results.errors.push({
        file: filePath,
        issue: 'File not found'
      });
      return;
    }
    
    if (patterns) {
      patterns.forEach(({ key, pattern: p }) => {
        const match = content.match(p);
        if (match && match[1] !== currentVersion) {
          allVersionsMatch = false;
          results.errors.push({
            file: filePath,
            issue: `Version mismatch in ${key}: found "${match[1]}", expected "${currentVersion}"`
          });
        }
      });
    } else if (pattern) {
      const match = content.match(pattern);
      if (match && match[1] !== currentVersion) {
        allVersionsMatch = false;
        results.errors.push({
          file: filePath,
          issue: `Version mismatch: found "${match[1]}", expected "${currentVersion}"`
        });
      }
    }
  });
  
  if (allVersionsMatch) {
    results.passed.push(`All versions consistent: v${currentVersion}`);
  }
}

/**
 * 检查必需文件
 */
function checkRequiredFiles() {
  console.log(`\n${colors.blue}🔍 Checking required files...${colors.reset}`);
  
  const requiredFiles = [
    'README.md',
    'LICENSE',
    'package.json',
    '.env.example',
    'src/index.js',
    'src/tools/download-video.js',
    'src/tools/list-downloads.js'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    const fullPath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(fullPath)) {
      allFilesExist = false;
      results.errors.push({
        file: file,
        issue: 'Required file missing'
      });
    }
  });
  
  if (allFilesExist) {
    results.passed.push('All required files present');
  }
}

/**
 * 检查测试文件更新
 */
function checkTestUpdates() {
  console.log(`\n${colors.blue}🔍 Checking test files...${colors.reset}`);
  
  const testFiles = ['test/test-server.js', 'test-basic.js'];
  const removedImports = [
    'search-videos',
    'nlp-processor',
    'parseNaturalQuery',
    'searchVideosTool'
  ];
  
  let testsUpdated = true;
  
  testFiles.forEach(testFile => {
    const fullPath = path.join(PROJECT_ROOT, testFile);
    const content = readFile(fullPath);
    
    if (!content) return;
    
    removedImports.forEach(removed => {
      if (content.includes(removed)) {
        testsUpdated = false;
        results.errors.push({
          file: testFile,
          issue: `Test file still references removed module: ${removed}`
        });
      }
    });
    
    // 检查参数名称
    if (content.includes('query:') && testFile.includes('download')) {
      results.warnings.push({
        file: testFile,
        issue: 'Test may be using old "query" parameter instead of "url"'
      });
    }
  });
  
  if (testsUpdated) {
    results.passed.push('Test files properly updated');
  }
}

/**
 * 检查环境变量一致性
 */
function checkEnvConsistency() {
  console.log(`\n${colors.blue}🔍 Checking environment variables...${colors.reset}`);
  
  const envExample = readFile(path.join(PROJECT_ROOT, '.env.example'));
  const readme = readFile(path.join(PROJECT_ROOT, 'README.md'));
  
  if (!envExample || !readme) {
    results.warnings.push({
      issue: 'Could not check env consistency - files missing'
    });
    return;
  }
  
  // 提取.env.example中的变量
  const envVars = envExample.match(/^[A-Z_]+=/gm) || [];
  const envVarNames = envVars.map(v => v.replace('=', ''));
  
  // 检查README中是否有过时的环境变量
  const outdatedEnvVars = [
    'GOOGLE_SEARCH_API_KEY',
    'GOOGLE_SEARCH_ENGINE_ID', 
    'BING_SEARCH_API_KEY',
    'FRAGMENT_RETRIES',
    'SEARCH_TIMEOUT',
    'MAX_SEARCH_RESULTS'
  ];
  
  let hasOutdated = false;
  outdatedEnvVars.forEach(varName => {
    if (readme.includes(varName) || envExample.includes(varName)) {
      hasOutdated = true;
      results.warnings.push({
        issue: `Outdated environment variable referenced: ${varName}`
      });
    }
  });
  
  if (!hasOutdated) {
    results.passed.push('Environment variables are consistent');
  }
}

/**
 * 生成报告
 */
function generateReport() {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}📊 Pre-Release Check Report${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
  
  // 通过的检查
  if (results.passed.length > 0) {
    console.log(`${colors.green}✅ Passed Checks (${results.passed.length}):${colors.reset}`);
    results.passed.forEach(item => {
      console.log(`   ${colors.green}✓${colors.reset} ${item}`);
    });
  }
  
  // 警告
  if (results.warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Warnings (${results.warnings.length}):${colors.reset}`);
    results.warnings.forEach(warning => {
      if (warning.file) {
        console.log(`   ${colors.yellow}⚠${colors.reset}  ${warning.file}: ${warning.issue}`);
      } else {
        console.log(`   ${colors.yellow}⚠${colors.reset}  ${warning.issue}`);
      }
    });
  }
  
  // 错误
  if (results.errors.length > 0) {
    console.log(`\n${colors.red}❌ Errors (${results.errors.length}):${colors.reset}`);
    results.errors.forEach(error => {
      if (error.file) {
        console.log(`   ${colors.red}✗${colors.reset} ${error.file}: ${error.issue}`);
        if (error.matches) {
          console.log(`     Found: ${error.matches.join(', ')}`);
        }
      } else {
        console.log(`   ${colors.red}✗${colors.reset} ${error.issue}`);
      }
    });
  }
  
  // 总结
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  const totalIssues = results.warnings.length + results.errors.length;
  
  if (totalIssues === 0) {
    console.log(`${colors.green}🎉 All checks passed! Ready for release.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Found ${totalIssues} issue(s). Please fix before releasing.${colors.reset}`);
    console.log(`${colors.yellow}   Warnings: ${results.warnings.length}${colors.reset}`);
    console.log(`${colors.red}   Errors: ${results.errors.length}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log(`${colors.magenta}🚀 DEWA Pre-Release Quality Check${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  
  // 运行所有检查
  checkLegacyReferences();
  checkVersionConsistency();
  checkRequiredFiles();
  checkTestUpdates();
  checkEnvConsistency();
  
  // 生成报告
  generateReport();
}

// 运行检查
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`${colors.red}💥 Check failed:${colors.reset}`, error);
    process.exit(1);
  });
}