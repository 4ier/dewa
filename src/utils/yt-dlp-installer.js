/**
 * yt-dlp Auto Installer and Detector
 * yt-dlp自动安装和检测工具
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { logger } from './logger.js';

// 常见的yt-dlp安装路径
const COMMON_PATHS = [
  '/usr/local/bin/yt-dlp',
  '/usr/bin/yt-dlp',
  '/opt/homebrew/bin/yt-dlp',
  '/home/linuxbrew/.linuxbrew/bin/yt-dlp',
  process.env.HOME + '/.local/bin/yt-dlp',
  './node_modules/.bin/yt-dlp'
];

/**
 * 检测yt-dlp是否已安装
 */
export async function detectYtDlp() {
  logger.info('🔍 Detecting yt-dlp installation...');
  
  // 首先检查环境变量指定的路径
  if (process.env.YT_DLP_PATH) {
    if (fs.existsSync(process.env.YT_DLP_PATH)) {
      const version = await getYtDlpVersion(process.env.YT_DLP_PATH);
      if (version) {
        logger.info(`✅ Found yt-dlp at ${process.env.YT_DLP_PATH} (${version})`);
        return process.env.YT_DLP_PATH;
      }
    }
  }
  
  // 检查PATH环境变量
  try {
    const which = process.platform === 'win32' ? 'where' : 'which';
    const ytDlpPath = execSync(`${which} yt-dlp`, { encoding: 'utf8' }).trim();
    if (ytDlpPath && fs.existsSync(ytDlpPath)) {
      const version = await getYtDlpVersion(ytDlpPath);
      if (version) {
        logger.info(`✅ Found yt-dlp in PATH: ${ytDlpPath} (${version})`);
        return ytDlpPath;
      }
    }
  } catch (error) {
    // yt-dlp not in PATH, continue checking common paths
  }
  
  // 检查常见安装路径
  for (const testPath of COMMON_PATHS) {
    if (fs.existsSync(testPath)) {
      const version = await getYtDlpVersion(testPath);
      if (version) {
        logger.info(`✅ Found yt-dlp at ${testPath} (${version})`);
        return testPath;
      }
    }
  }
  
  logger.warn('⚠️  yt-dlp not found in common locations');
  return null;
}

/**
 * 获取yt-dlp版本
 */
async function getYtDlpVersion(ytDlpPath) {
  try {
    const version = execSync(`"${ytDlpPath}" --version`, { 
      encoding: 'utf8',
      timeout: 5000
    }).trim();
    return version;
  } catch (error) {
    return null;
  }
}

/**
 * 自动安装yt-dlp
 */
export async function installYtDlp() {
  logger.info('📦 Starting yt-dlp installation...');
  
  const platform = process.platform;
  
  try {
    if (platform === 'linux' || platform === 'darwin') {
      await installOnUnix();
    } else if (platform === 'win32') {
      await installOnWindows();
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    
    // 安装后重新检测
    const ytDlpPath = await detectYtDlp();
    if (ytDlpPath) {
      logger.info('✅ yt-dlp installation completed successfully');
      return ytDlpPath;
    } else {
      throw new Error('yt-dlp installation failed - not found after installation');
    }
    
  } catch (error) {
    logger.error('❌ yt-dlp installation failed:', error.message);
    throw error;
  }
}

/**
 * 在Unix系统上安装yt-dlp
 */
async function installOnUnix() {
  logger.info('🐧 Installing yt-dlp on Unix system...');
  
  const installMethods = [
    // 方法1: 使用pip3
    async () => {
      try {
        execSync('python3 -m pip install --user yt-dlp', { 
          stdio: 'inherit',
          timeout: 120000 
        });
        return true;
      } catch (error) {
        return false;
      }
    },
    
    // 方法2: 使用pip
    async () => {
      try {
        execSync('pip install --user yt-dlp', { 
          stdio: 'inherit',
          timeout: 120000 
        });
        return true;
      } catch (error) {
        return false;
      }
    },
    
    // 方法3: 直接下载二进制文件
    async () => {
      try {
        const installDir = path.join(process.env.HOME, '.local/bin');
        if (!fs.existsSync(installDir)) {
          fs.mkdirSync(installDir, { recursive: true });
        }
        
        const ytDlpPath = path.join(installDir, 'yt-dlp');
        
        execSync(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "${ytDlpPath}"`, {
          stdio: 'inherit',
          timeout: 120000
        });
        
        execSync(`chmod +x "${ytDlpPath}"`, { stdio: 'inherit' });
        
        return true;
      } catch (error) {
        return false;
      }
    }
  ];
  
  for (let i = 0; i < installMethods.length; i++) {
    logger.info(`📥 Trying installation method ${i + 1}...`);
    const success = await installMethods[i]();
    if (success) {
      logger.info(`✅ Installation method ${i + 1} succeeded`);
      return;
    }
    logger.warn(`⚠️  Installation method ${i + 1} failed, trying next...`);
  }
  
  throw new Error('All installation methods failed');
}

/**
 * 在Windows系统上安装yt-dlp
 */
async function installOnWindows() {
  logger.info('🪟 Installing yt-dlp on Windows...');
  
  try {
    // 使用pip安装
    execSync('pip install yt-dlp', { 
      stdio: 'inherit',
      timeout: 120000 
    });
  } catch (error) {
    // 如果pip失败，尝试下载exe文件
    logger.info('📥 Trying direct download...');
    
    const appData = process.env.APPDATA || process.env.LOCALAPPDATA;
    const installDir = path.join(appData, 'yt-dlp');
    
    if (!fs.existsSync(installDir)) {
      fs.mkdirSync(installDir, { recursive: true });
    }
    
    const ytDlpPath = path.join(installDir, 'yt-dlp.exe');
    
    execSync(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o "${ytDlpPath}"`, {
      stdio: 'inherit',
      timeout: 120000
    });
  }
}

/**
 * 确保yt-dlp可用（检测或安装）
 */
export async function ensureYtDlp() {
  logger.info('🔧 Ensuring yt-dlp is available...');
  
  // 首先尝试检测
  let ytDlpPath = await detectYtDlp();
  
  if (ytDlpPath) {
    return ytDlpPath;
  }
  
  // 如果没找到，尝试安装
  logger.info('📦 yt-dlp not found, attempting automatic installation...');
  ytDlpPath = await installYtDlp();
  
  return ytDlpPath;
}

/**
 * 更新yt-dlp到最新版本
 */
export async function updateYtDlp(ytDlpPath) {
  logger.info('🔄 Updating yt-dlp to latest version...');
  
  try {
    execSync(`"${ytDlpPath}" --update`, {
      stdio: 'inherit',
      timeout: 60000
    });
    logger.info('✅ yt-dlp updated successfully');
  } catch (error) {
    logger.warn('⚠️  Failed to update yt-dlp:', error.message);
    // 更新失败不应该阻止程序运行
  }
}