#!/bin/bash

# 🔧 彻底修复 .env 文件读取问题
# 问题：磁盘空间满导致文件读取超时

echo "🔍 诊断 .env 文件问题..."
echo ""

# 1. 检查磁盘空间
echo "=== 1. 检查磁盘空间 ==="
df -h . | head -2
DISK_USAGE=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
echo "磁盘使用率: ${DISK_USAGE}%"
if [ "$DISK_USAGE" -gt 95 ]; then
    echo "⚠️ 警告：磁盘空间不足！这是导致文件读取超时的可能原因"
    echo "💡 建议：清理磁盘空间，释放至少 5-10GB"
fi
echo ""

# 2. 检查文件状态
echo "=== 2. 检查 .env 文件状态 ==="
if [ -f ".env" ]; then
    echo "✅ 文件存在"
    ls -lh .env
    echo ""
    
    # 3. 尝试多种方法恢复
    echo "=== 3. 尝试恢复文件内容 ==="
    
    # 方法1: 使用 hexdump（通常能绕过文件系统问题）
    echo "方法1: 使用 hexdump..."
    if hexdump -C -n 713 .env > .env.hexdump 2>/dev/null; then
        echo "✅ hexdump 成功，转换中..."
        # 将 hexdump 转换回文本（简单方法）
        python3 << 'PYEOF'
import re
with open('.env.hexdump', 'r') as f:
    lines = f.readlines()
    content = []
    for line in lines:
        # hexdump 格式: 00000000  43 4f 4e 54 45 4e 54  |CONTENT|
        parts = line.split('|')
        if len(parts) > 1:
            text_part = parts[1].strip()
            content.append(text_part)
    recovered = ''.join(content)
    with open('.env.recovered', 'w') as out:
        out.write(recovered)
    print(f"✅ 恢复成功: {len(recovered)} 字符")
    print(f"前200字符: {recovered[:200]}")
PYEOF
        if [ -f ".env.recovered" ] && [ -s ".env.recovered" ]; then
            echo "✅ 恢复文件已创建: .env.recovered"
        fi
    else
        echo "❌ hexdump 失败"
    fi
    echo ""
    
    # 方法2: 检查是否有备份
    echo "方法2: 查找备份文件..."
    for backup in .env.backup .env.old .env.bak .env.example .env.template; do
        if [ -f "$backup" ] && [ -s "$backup" ]; then
            echo "✅ 找到备份: $backup"
            cp "$backup" .env.recovered 2>/dev/null && echo "✅ 从备份恢复" || echo "❌ 备份恢复失败"
            break
        fi
    done
    echo ""
    
    # 4. 如果恢复成功，提供替换选项
    if [ -f ".env.recovered" ] && [ -s ".env.recovered" ]; then
        echo "=== 4. 恢复文件已创建 ==="
        echo "文件: .env.recovered"
        echo "大小: $(wc -c < .env.recovered) 字节"
        echo ""
        echo "💡 下一步操作："
        echo "   1. 检查 .env.recovered 的内容是否正确"
        echo "   2. 如果正确，运行: mv .env.recovered .env"
        echo "   3. 清理磁盘空间（重要！）"
    else
        echo "❌ 无法自动恢复"
        echo ""
        echo "💡 建议："
        echo "   1. 清理磁盘空间（释放至少 5-10GB）"
        echo "   2. 重启电脑"
        echo "   3. 如果文件很重要，尝试数据恢复工具"
        echo "   4. 或者手动重新创建 .env 文件"
    fi
else
    echo "❌ .env 文件不存在"
fi

echo ""
echo "=== 完成 ==="






