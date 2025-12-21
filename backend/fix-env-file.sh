#!/bin/bash

# 🔧 修复 .env 文件读取问题
# 用途：如果 .env 文件无法读取，尝试恢复或重新创建

echo "🔍 检查 .env 文件状态..."

ENV_FILE=".env"
BACKUP_FILE=".env.backup"

# 检查文件是否存在
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env 文件不存在"
    exit 1
fi

# 尝试读取文件（5秒超时）
echo "📖 尝试读取 .env 文件..."
timeout 5 cat "$ENV_FILE" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ .env 文件可以正常读取"
    exit 0
fi

echo "⚠️ .env 文件读取超时，尝试修复..."

# 方法1: 尝试复制文件（绕过可能的锁定问题）
echo "方法1: 尝试复制文件..."
cp "$ENV_FILE" "${ENV_FILE}.tmp" 2>/dev/null

if [ $? -eq 0 ] && [ -f "${ENV_FILE}.tmp" ]; then
    mv "${ENV_FILE}.tmp" "$ENV_FILE"
    echo "✅ 通过复制方式修复成功"
    exit 0
fi

# 方法2: 检查是否有备份
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    echo "方法2: 从备份恢复..."
    cp "$BACKUP_FILE" "$ENV_FILE"
    echo "✅ 从备份恢复成功"
    exit 0
fi

# 方法3: 提示用户手动恢复
echo "❌ 自动修复失败"
echo ""
echo "💡 建议："
echo "   1. 检查是否有其他进程在使用 .env 文件"
echo "   2. 如果有备份，手动复制到 .env"
echo "   3. 或者重新创建 .env 文件（参考 .env.example 或项目文档）"
echo ""
echo "🔧 如果文件被锁定，可以尝试："
echo "   - 重启 VS Code 或其他编辑器"
echo "   - 检查是否有 Python 进程在运行"
echo "   - 使用 'lsof .env' 查看占用进程"

exit 1















