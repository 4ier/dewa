# DEWA - 智能AI下载器

🎬 **DEWA** (Download Everything With AI) 是一个基于MCP (Model Context Protocol) 的智能下载器，支持自然语言查询和AI工具调用。

## ✨ 特性

- 🤖 **MCP标准兼容** - 支持Claude Code和其他MCP客户端
- 🗣️ **自然语言支持** - "下载周杰伦的稻香" → 自动搜索并下载
- 🔗 **直接URL下载** - 支持YouTube、Bilibili等主流平台
- 📁 **智能文件管理** - 自动分类和命名
- 🔍 **Web搜索集成** - 自动查找最佳视频源
- ⚡ **断点续传** - 网络中断后可恢复下载
- 🧹 **自动清理** - 下载完成后清理碎片文件

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

智能视频下载工具，支持URL和自然语言查询。

**参数:**
- `query` (string, 必需): 视频URL或自然语言查询
- `platform_preference` (string, 可选): 优先平台 ("youtube", "bilibili", "any")
- `quality` (string, 可选): 视频质量 ("best", "worst", "720p", "1080p")
- `custom_directory` (string, 可选): 自定义下载目录
- `custom_filename` (string, 可选): 自定义文件名

**示例:**

```javascript
// 直接URL下载
await downloadVideo({
  query: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
});

// 自然语言查询
await downloadVideo({
  query: "下载Taylor Swift最新MV",
  platform_preference: "youtube",
  quality: "1080p"
});
```

### `search_videos`

搜索视频但不下载，返回候选列表。

**参数:**
- `query` (string, 必需): 搜索查询
- `platform` (string, 可选): 搜索平台
- `limit` (number, 可选): 结果数量限制

### `list_downloads`

列出下载历史和当前状态。

## 🏗️ 项目结构

```
natural-video-downloader/
├── src/
│   ├── index.js              # MCP服务器入口
│   ├── tools/                # MCP工具实现
│   │   ├── download-video.js
│   │   ├── search-videos.js
│   │   └── list-downloads.js
│   ├── core/                 # 核心下载引擎
│   │   ├── downloader.js     # 下载核心（从wacken项目移植）
│   │   ├── platforms.js      # 平台适配器
│   │   └── file-manager.js   # 文件管理
│   ├── search/               # 搜索模块
│   │   ├── web-search.js     # Web搜索集成
│   │   ├── video-parser.js   # 视频信息解析
│   │   └── nlp-processor.js  # 自然语言处理
│   └── utils/                # 工具函数
│       ├── logger.js
│       ├── config.js
│       └── validators.js
├── test/                     # 测试文件
├── docs/                     # 文档
├── .env.example              # 环境变量模板
├── package.json
└── README.md
```

## 🔧 配置

### 环境变量

```bash
# 基础配置
DOWNLOAD_PATH=/mnt/share/movie  # 下载目录
LOG_LEVEL=info                  # 日志级别

# 搜索API密钥（可选）
GOOGLE_SEARCH_API_KEY=your_key
GOOGLE_SEARCH_ENGINE_ID=your_id
BING_SEARCH_API_KEY=your_key

# 平台特定配置
YOUTUBE_QUALITY_PREFERENCE=best
BILIBILI_QUALITY_PREFERENCE=best
```

## 📖 使用示例

### 在Claude Code中使用

```
用户: 下载周杰伦的稻香MV

AI: 我来帮你下载周杰伦的《稻香》MV。

[调用 download_video 工具]
- query: "周杰伦 稻香 MV"
- platform_preference: "any"
- quality: "best"

下载已开始，文件将保存到: /mnt/share/movie/music/周杰伦 - 稻香.mp4
```

### 直接URL下载

```
用户: https://www.youtube.com/watch?v=dQw4w9WgXcQ

AI: 检测到YouTube链接，开始下载...

[调用 download_video 工具]
- query: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

视频信息:
- 标题: Rick Astley - Never Gonna Give You Up
- 时长: 3:33
- 大小: 12.5MB
- 保存路径: /mnt/share/movie/youtube/Rick Astley - Never Gonna Give You Up.mp4
```

## 🔍 搜索功能

支持多种搜索引擎和策略：

1. **Google Custom Search** - 高质量结果
2. **Bing Video Search** - 视频专门搜索
3. **直接平台搜索** - YouTube/Bilibili API
4. **智能结果排序** - 基于质量、时长、观看数

## 🚦 开发状态

- ✅ MCP服务器框架
- ✅ 核心下载引擎移植
- ✅ 基础工具定义
- 🚧 Web搜索集成
- 🚧 自然语言处理
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