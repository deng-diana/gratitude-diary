#!/bin/bash

# 🚀 本地开发服务器启动脚本
# 用途：启动后端服务器，监听所有网络接口（0.0.0.0）
# 这样真机和模拟器都可以同时连接到本地后端

echo "🚀 启动本地开发服务器..."
echo "📡 监听地址: http://0.0.0.0:8000"
echo "📱 模拟器访问: http://127.0.0.1:8000"
# macOS 使用 ifconfig 获取 IP，Linux 使用 hostname -I
if [[ "$(uname)" == "Darwin" ]]; then
  LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
else
  LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
fi
echo "📱 真机访问: http://${LOCAL_IP:-localhost}:8000"
echo ""
echo "💡 提示："
echo "   - Swagger文档: http://127.0.0.1:8000/docs"
echo "   - 健康检查: http://127.0.0.1:8000/health"
echo "   - 按 Ctrl+C 停止服务器"
echo ""

# 激活虚拟环境（如果存在）
if [ -d "venv" ]; then
    source venv/bin/activate
    PYTHON_CMD="$(pwd)/venv/bin/python"
elif [ -d ".venv" ]; then
    source .venv/bin/activate
    PYTHON_CMD="$(pwd)/.venv/bin/python"
else
    PYTHON_CMD="python"
    echo "⚠️ 警告: 未找到虚拟环境，使用系统 Python"
fi

# 启动服务器，监听所有网络接口
echo "🚀 使用 Python: $PYTHON_CMD"
$PYTHON_CMD -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
