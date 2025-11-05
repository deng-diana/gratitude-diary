#!/bin/bash

# ============================================
# 感恩日记API部署脚本
# 用途: 自动构建Docker镜像并部署到AWS Lambda
# ============================================

# 遇到错误立即退出
set -e
# 显示每一步执行的命令(方便调试)
set -x

# ========== 配置区域 ==========
# 请修改为你自己的值

# AWS配置
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="633404778395"  # 在AWS Console右上角可以看到

# ECR仓库名(存放Docker镜像的地方)
ECR_REPO_NAME="gratitude-diary"

# Lambda函数名
LAMBDA_FUNCTION_NAME="gratitude-diary-api"

# ECR 完整 URI（便于重复使用）
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"

# ==============================

# 颜色输出(让脚本输出更好看)
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 打印带颜色的消息
echo_green() {
    echo -e "${GREEN}✅ $1${NC}"
}
echo_yellow() {
    echo -e "${YELLOW}📦 $1${NC}"
}
echo_red() {
    echo -e "${RED}❌ $1${NC}"
}

# 开始部署
echo_green "开始部署感恩日记API到AWS Lambda..."
echo ""

# ========== 步骤1: 检查必要的工具 ==========
echo_yellow "步骤1/7: 检查必要工具..."

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo_red "错误: 没有安装Docker"
    echo "请先安装Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo_green "Docker已安装"

# 检查AWS CLI
if ! command -v aws &> /dev/null; then
    echo_red "错误: 没有安装AWS CLI"
    echo "请先安装AWS CLI"
    exit 1
fi
echo_green "AWS CLI已安装"

# 检查AWS配置（凭证）
if ! aws sts get-caller-identity --region "$AWS_REGION" &> /dev/null; then
    echo_red "错误: AWS CLI没有配置或凭证无效"
    echo "请运行: aws configure"
    exit 1
fi
echo_green "AWS CLI已配置"

echo ""

# ========== 步骤2: 登录到ECR ==========
echo_yellow "步骤2/7: 登录到ECR (AWS的Docker镜像仓库)..."

aws ecr get-login-password --region "$AWS_REGION" \
| docker login --username AWS --password-stdin \
  "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo_green "ECR登录成功"
echo ""

# ========== 步骤3: 创建ECR仓库(如果不存在) ==========
echo_yellow "步骤3/7: 检查并创建ECR仓库..."

if ! aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" --region "$AWS_REGION" &> /dev/null; then
    echo "仓库不存在,正在创建..."
    aws ecr create-repository \
        --repository-name "$ECR_REPO_NAME" \
        --region "$AWS_REGION" \
        --image-scanning-configuration scanOnPush=true
    echo_green "ECR仓库创建成功"
else
    echo_green "ECR仓库已存在"
fi
echo ""

# ========== 步骤4: 构建Docker镜像 ==========
echo_yellow "步骤4/7: 构建Docker镜像 (可能需要几分钟)..."

# 为保证与 AWS Lambda 兼容，关闭 BuildKit（避免 zstd/provenance），使用 gzip 层
export DOCKER_BUILDKIT=0

# 若在 Apple 芯片本机构建，默认产出 arm64 镜像；如需 x86_64 请改为 lambda-amd64 并在 x86 机器上构建或使用 buildx
IMAGE_TAG="latest"   # 可改为 lambda-amd64（对应 Lambda 选择 x86_64）

docker build --pull -t "$ECR_REPO_NAME:$IMAGE_TAG" .

echo_green "Docker镜像构建成功"
echo ""

# ========== 步骤5: 给镜像打标签 ==========
echo_yellow "步骤5/7: 给镜像打标签..."

docker tag "$ECR_REPO_NAME:$IMAGE_TAG" "$ECR_URI:$IMAGE_TAG"

echo_green "镜像打标签成功"
echo ""

# ========== 步骤6: 推送镜像到ECR ==========
echo_yellow "步骤6/7: 推送镜像到ECR (可能需要几分钟)..."

docker push "$ECR_URI:$IMAGE_TAG"

echo_green "镜像推送成功"
echo ""

# ========== 步骤7: 更新Lambda函数 ==========
echo_yellow "步骤7/7: 更新Lambda函数..."

# 检查Lambda函数是否存在
if aws lambda get-function --function-name "$LAMBDA_FUNCTION_NAME" --region "$AWS_REGION" &> /dev/null; then
    # 函数存在,更新代码为最新镜像
    aws lambda update-function-code \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --image-uri "$ECR_URI:$IMAGE_TAG" \
        --region "$AWS_REGION"
    echo_green "Lambda函数更新成功"
else
    echo_red "Lambda函数不存在,需要先在AWS Console创建"
    echo "请在控制台按 'Container image' 创建函数，镜像选择 $ECR_URI:$IMAGE_TAG，然后再运行此脚本。"
    exit 1
fi

echo ""
echo_green "=========================================="
echo_green "🎉 部署完成!"
echo_green "=========================================="
echo ""
echo "API端点: 请在AWS Lambda控制台查看 Function URL 或 API Gateway URL"
echo "注意：如果使用 Apple 芯片本机构建，镜像默认是 arm64，请在 Lambda 控制台选择 Architecture=arm64。"
echo "若你改为 x86_64 构建（IMAGE_TAG=lambda-amd64），请在 Lambda 控制台选择 Architecture=x86_64。"
echo ""