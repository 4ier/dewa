#!/bin/bash

# DEWA Pre-Release Script
# 运行代码质量检查的便捷脚本

set -e

echo "🚀 DEWA 发布前检查开始..."

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  警告: 需要Node.js 18或更高版本，当前版本: $(node --version)"
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装项目依赖..."
    npm install
fi

# 运行代码质量检查
echo "🔍 运行代码质量检查..."
if npm run quality-check; then
    echo ""
    echo "✅ 代码质量检查通过！"
    echo "🎉 项目已准备好发布"
    echo ""
    echo "下一步可以执行:"
    echo "  npm publish          # 发布到npm"
    echo "  git tag v$(node -p \"require('./package.json').version\")   # 创建版本标签"
    echo "  git push --tags      # 推送标签到远程仓库"
    exit 0
else
    echo ""
    echo "❌ 代码质量检查失败"
    echo "🛠️  请根据上述报告修复问题后重新运行检查"
    echo ""
    echo "常见修复方法:"
    echo "  - 完成或移除TODO/FIXME注释"
    echo "  - 统一package.json中的版本号"
    echo "  - 检查并修复导入路径错误"
    echo "  - 更新README文档中的版本信息"
    exit 1
fi