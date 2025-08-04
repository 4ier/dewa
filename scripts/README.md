# DEWA 代码质量检查工具

## 概述

`pre-release-check.js` 是一个全面的自动化代码质量检查工具，专为DEWA项目设计。它在每次发布前自动检查常见问题，确保代码质量和一致性。

## 功能特性

### 🔍 检查项目

1. **遗留代码引用** - 搜索并报告过时的项目引用、注释、硬编码路径
2. **架构一致性** - 确保代码与当前架构设计一致
3. **测试覆盖** - 检查测试是否适配最新的代码结构
4. **配置一致性** - 验证配置文件、环境变量示例、文档的一致性
5. **版本同步** - 确保所有文件中的版本号保持同步
6. **依赖检查** - 验证导入语句、模块引用的正确性
7. **文档更新** - 检查README、注释是否反映最新功能

### 📊 输出特性

- **彩色输出** - 清晰的错误、警告和成功状态显示
- **进度显示** - 实时显示检查进度
- **详细报告** - 包含文件位置、行号和修复建议
- **JSON报告** - 生成详细的`quality-report.json`文件

## 使用方法

### 快速使用

```bash
# 运行代码质量检查
npm run quality-check

# 或者直接运行脚本
npm run pre-release

# 或者直接执行
node scripts/pre-release-check.js
```

### 退出码

- `0` - 检查通过，没有严重问题
- `1` - 检查失败，存在需要修复的问题

## 输出示例

### 检查通过
```
🚀 DEWA 代码质量检查工具
项目路径: /path/to/dewa

🔍 检查: 遗留代码引用检查
✅ 进度: 14%
...

=== 代码质量检查报告 ===
检查项目: 7
完成项目: 7
发现问题: 0
警告信息: 2

🎉 代码质量检查通过！
✅ 项目已准备好发布
```

### 检查失败
```
❌ 代码质量检查失败！
🛑 请修复上述问题后重新检查

🚨 严重问题:
1. [版本] package.json 版本与 MCP 版本不匹配
   📁 文件: package.json
   💡 建议: 统一两个版本号

⚠️ 警告信息:
1. [测试] 核心模块缺少测试: downloader
   📁 文件: src/core/downloader.js
   💡 建议: 创建 downloader.test.js
```

## 检查详情

### 遗留代码引用检查
- `TODO:`/`FIXME:` 注释
- `console.log()` 调试语句
- `debugger;` 断点
- 硬编码的本地地址和路径
- 不合适的测试文件引用

### 架构一致性检查
- 预期目录结构 (`src`, `test`, `docs`)
- 核心模块结构 (`core`, `tools`, `utils`)
- 导入路径有效性
- ES6/CommonJS模块混用检查

### 测试覆盖检查
- 测试文件存在性
- 核心模块测试覆盖
- package.json中测试脚本配置

### 配置一致性检查
- package.json必需字段
- MCP配置完整性
- 环境变量示例文件

### 版本同步检查
- package.json与MCP版本一致性
- 源码中的版本引用
- README文档中的版本号

### 依赖检查
- 关键依赖存在性
- 未使用依赖识别
- node_modules目录检查

### 文档更新检查
- README.md必需部分
- API文档与实际工具匹配
- 示例代码语法检查
- 链接有效性验证

## 自定义配置

工具当前使用硬编码的检查规则，但可以通过修改 `pre-release-check.js` 来自定义：

### 添加新的遗留代码模式
```javascript
const legacyPatterns = [
  { pattern: /YOUR_PATTERN/gi, name: '描述', severity: 'error|warning' }
];
```

### 修改必需目录
```javascript
const expectedDirs = ['src', 'test', 'docs', 'your-dir'];
```

### 添加必需依赖
```javascript
const requiredDeps = ['@modelcontextprotocol/sdk', 'zod', 'your-dep'];
```

## 集成到CI/CD

### GitHub Actions
```yaml
name: Quality Check
on: [push, pull_request]
jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run quality-check
```

### 在发布前运行
```bash
#!/bin/bash
echo "运行代码质量检查..."
if npm run quality-check; then
  echo "✅ 质量检查通过，准备发布"
  npm publish
else
  echo "❌ 质量检查失败，请修复问题后重试"
  exit 1
fi
```

## 报告文件

工具会生成 `quality-report.json` 文件，包含：
- 检查时间戳
- 项目路径
- 检查结果摘要
- 详细的问题和警告列表

这个文件可以用于：
- CI/CD系统集成
- 历史问题追踪
- 自动化修复工具输入

## 故障排除

### 常见问题

1. **权限错误**
   ```bash
   chmod +x scripts/pre-release-check.js
   ```

2. **模块未找到**
   ```bash
   npm install
   ```

3. **路径错误**
   - 确保在项目根目录运行
   - 检查 package.json 中的脚本路径

### 调试模式

修改脚本开头添加调试输出：
```javascript
const DEBUG = true; // 启用调试模式
```

## 贡献

欢迎改进这个工具！建议的改进方向：
- 添加更多检查规则
- 支持配置文件
- 添加自动修复功能
- 改进报告格式
- 支持其他文件类型

## 许可证

与DEWA项目相同，基于MIT许可证开源。