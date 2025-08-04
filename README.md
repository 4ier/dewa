# DEWA - Download Everything With AI

🎬 **DEWA** (Download Everything With AI) 是一个专注于视频下载和任务管理的简单MCP服务器。

## ✨ 特性

- 🤖 **MCP标准兼容** - 支持Claude Code和其他MCP客户端
- 🔗 **直接URL下载** - 支持YouTube、Bilibili等主流平台
- 📁 **智能文件管理** - 自动分类和命名
- ⚡ **断点续传** - 网络中断后可恢复下载
- 🧹 **自动清理** - 下载完成后清理碎片文件
- 📋 **任务管理** - 查看下载历史和状态

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/4ier/dewa.git
cd dewa
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件设置下载路径和API密钥
```

### 4. 启动MCP服务器

```bash
npm start
```

### 5. 在Claude Code中配置

将以下配置添加到你的MCP设置文件中：

```json
{
  "mcpServers": {
    "dewa": {
      "command": "node",
      "args": ["/path/to/dewa/src/index.js"],
      "env": {
        "DOWNLOAD_PATH": "/your/download/path"
      }
    }
  }
}
```

## 🛠️ MCP工具

### `download_video`

视频下载工具，接收具体的视频URL进行下载。

**参数:**
- `url` (string, 必需): 视频URL
- `quality` (string, 可选): 视频质量 ("best", "worst", "720p", "1080p")
- `custom_directory` (string, 可选): 自定义下载目录
- `custom_filename` (string, 可选): 自定义文件名

**示例:**

```javascript
// URL下载
await downloadVideo({
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  quality: "1080p"
});
```

### `list_downloads`

列出下载历史和当前状态。

## 🏗️ 项目结构

```
dewa/
├── src/
│   ├── index.js              # MCP服务器入口
│   ├── tools/                # MCP工具实现
│   │   ├── download-video.js
│   │   └── list-downloads.js
│   ├── core/                 # 核心下载引擎
│   │   ├── downloader.js     # 下载核心
│   │   ├── platforms.js      # 平台适配器
│   │   ├── download-manager.js
│   │   ├── file-manager.js   # 文件管理
│   │   └── video-info.js
│   └── utils/                # 工具函数
│       ├── logger.js
│       ├── config.js
│       ├── formatters.js
│       └── validators.js
├── test/                     # 测试文件
├── docs/                     # 文档
├── package.json
└── README.md
```

## 🔧 配置

### 环境变量

```bash
# 基础配置
DOWNLOAD_PATH=/mnt/share/movie  # 下载目录
LOG_LEVEL=info                  # 日志级别

# yt-dlp配置
YT_DLP_PATH=/usr/local/bin/yt-dlp
MAX_RETRIES=10
CONCURRENT_FRAGMENTS=4
THROTTLED_RATE=100K
DEFAULT_QUALITY=best

# 文件管理配置
AUTO_CLEANUP=true
KEEP_FRAGMENTS=false
DOWNLOAD_HISTORY_RETENTION_DAYS=30
```

## 📖 使用示例

### 设计理念

DEWA采用了清晰的职责分离设计：

1. **AI负责搜索**：Claude等AI负责理解用户需求，搜索视频，找到具体的URL
2. **DEWA负责下载**：接收具体的视频URL，专注于下载和任务管理

### 在Claude Code中使用

```
用户: 下载周杰伦的稻香MV

AI: 我先为你搜索周杰伦的《稻香》MV...
[AI进行web搜索，找到视频URL]

找到了视频：https://www.youtube.com/watch?v=xxx
现在开始下载...

[调用 download_video 工具]
- url: "https://www.youtube.com/watch?v=xxx"
- quality: "best"

下载已开始，文件将保存到: /mnt/share/movie/周杰伦 - 稻香.mp4
```

### 直接URL下载

```
用户: https://www.youtube.com/watch?v=dQw4w9WgXcQ

AI: 检测到YouTube链接，开始下载...

[调用 download_video 工具]
- url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

视频信息:
- 标题: Rick Astley - Never Gonna Give You Up
- 时长: 3:33
- 大小: 12.5MB
- 保存路径: /mnt/share/movie/Rick Astley - Never Gonna Give You Up.mp4
```

## 🚦 开发状态

- ✅ MCP服务器框架
- ✅ 核心下载引擎
- ✅ 基础工具定义（download_video, list_downloads）
- ✅ 简化架构设计（移除搜索功能）
- ⏳ 测试套件
- ⏳ 文档完善

## 🤝 贡献

欢迎贡献代码、报告问题或提出改进建议！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - 强大的视频下载工具
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - Model Context Protocol SDK
- Wacken项目 - 提供了核心下载引擎基础