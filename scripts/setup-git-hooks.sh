#!/bin/bash
#
# 安装 Git hooks
# 这个脚本会安装 pre-commit hook，确保提交前检查关键配置
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "🔧 正在安装 Git hooks..."

# 复制 pre-commit hook
if [ -f "$HOOKS_DIR/pre-commit" ]; then
    echo "⚠️  pre-commit hook 已存在，正在覆盖..."
fi

cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/sh
#
# Pre-commit hook: 检查关键配置
# 确保不会把开发环境配置提交到代码库
#

# 检查 IS_LOCAL_DEV 是否为 false
if grep -q "const IS_LOCAL_DEV = true" mobile/src/config/aws-config.ts 2>/dev/null; then
    echo ""
    echo "❌ 错误：IS_LOCAL_DEV 仍为 true！"
    echo ""
    echo "请将 mobile/src/config/aws-config.ts 中的 IS_LOCAL_DEV 改为 false"
    echo "然后再提交代码。"
    echo ""
    exit 1
fi

# 检查 DEV_MODE_FORCE_ONBOARDING 是否为 false
if grep -q "const DEV_MODE_FORCE_ONBOARDING = true" mobile/src/navigation/AppNavigator.tsx 2>/dev/null; then
    echo ""
    echo "❌ 错误：DEV_MODE_FORCE_ONBOARDING 仍为 true！"
    echo ""
    echo "请将 mobile/src/navigation/AppNavigator.tsx 中的 DEV_MODE_FORCE_ONBOARDING 改为 false"
    echo "然后再提交代码。"
    echo ""
    exit 1
fi

exit 0
EOF

chmod +x "$HOOKS_DIR/pre-commit"

echo "✅ Git hooks 安装完成！"
echo ""
echo "现在每次提交前都会自动检查："
echo "  - IS_LOCAL_DEV 是否为 false"
echo "  - DEV_MODE_FORCE_ONBOARDING 是否为 false"
echo ""




