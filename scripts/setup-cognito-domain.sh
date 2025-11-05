#!/bin/bash

##############################################
# AWS Cognito 自定义域名配置脚本
# 
# 使用方法：
# chmod +x scripts/setup-cognito-domain.sh
# ./scripts/setup-cognito-domain.sh
##############################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
REGION="us-east-1"
DOMAIN="auth.thankly.app"
USER_POOL_ID="us-east-1_1DgDNffb0"
APP_CLIENT_ID="6e521vvi1g2a1efbf3l70o83k2"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AWS Cognito 自定义域名配置向导${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查 AWS CLI 是否安装
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI 未安装${NC}"
    echo "请访问: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI 已安装${NC}"
echo ""

# 检查 AWS 凭证
echo -e "${YELLOW}📋 正在检查 AWS 凭证...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS 凭证未配置${NC}"
    echo "运行: aws configure"
    exit 1
fi

echo -e "${GREEN}✅ AWS 凭证配置正常${NC}"
echo ""

# 第一步：创建 SSL 证书
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}第一步：创建 SSL 证书${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查是否已存在证书
EXISTING_CERT=$(aws acm list-certificates \
    --region $REGION \
    --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn" \
    --output text 2>/dev/null || true)

if [ -n "$EXISTING_CERT" ]; then
    echo -e "${GREEN}✅ 证书已存在: $EXISTING_CERT${NC}"
    CERT_ARN=$EXISTING_CERT
else
    echo -e "${YELLOW}📝 请求新证书...${NC}"
    CERT_ARN=$(aws acm request-certificate \
        --domain-name $DOMAIN \
        --validation-method DNS \
        --region $REGION \
        --query 'CertificateArn' \
        --output text)
    
    echo -e "${GREEN}✅ 证书已请求: $CERT_ARN${NC}"
    
    # 获取 DNS 验证记录
    echo ""
    echo -e "${YELLOW}📋 DNS 验证记录:${NC}"
    aws acm describe-certificate \
        --certificate-arn $CERT_ARN \
        --region $REGION \
        --query 'Certificate.DomainValidationOptions[*].[DomainName,ResourceRecord.Name,ResourceRecord.Value]' \
        --output table
    
    echo ""
    echo -e "${YELLOW}⚠️  请在你的 DNS 提供商添加上述 CNAME 记录${NC}"
    echo -e "${YELLOW}然后按回车继续...${NC}"
    read -r
fi

echo ""
echo -e "${GREEN}✅ 第一步完成${NC}"
echo ""

# 等待用户配置 Cognito 自定义域名
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}第二步：在 Cognito 配置自定义域名${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}请按以下步骤操作：${NC}"
echo "1. 访问: https://console.aws.amazon.com/cognito/v2/idp/user-pools"
echo "2. 选择用户池: $USER_POOL_ID"
echo "3. 左侧菜单: 应用程序集成 → 域名"
echo "4. 点击: 添加自定义域"
echo "5. 子域名: auth"
echo "6. 证书: 选择上面创建的证书"
echo ""
echo -e "${YELLOW}完成后按回车继续...${NC}"
read -r

# 获取 Cognito 自定义域名信息
echo ""
echo -e "${YELLOW}📋 正在获取 Cognito 域名信息...${NC}"
COGNITO_DOMAIN=$(aws cognito-idp describe-user-pool-domain \
    --domain $DOMAIN \
    --region $REGION \
    --query 'CustomDomainConfig.CloudFrontDomainName' \
    --output text 2>/dev/null || true)

if [ -n "$COGNITO_DOMAIN" ]; then
    echo -e "${GREEN}✅ Cognito 域名已配置${NC}"
    echo -e "${GREEN}   CloudFront 域名: $COGNITO_DOMAIN${NC}"
else
    echo -e "${RED}❌ 未找到 Cognito 自定义域名配置${NC}"
    echo "请先完成第二步的手动配置"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ 第二步完成${NC}"
echo ""

# 第三步：DNS 配置提醒
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}第三步：配置 DNS 记录${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}请在你的 DNS 提供商添加 CNAME 记录:${NC}"
echo ""
echo -e "${GREEN}类型:${NC} CNAME"
echo -e "${GREEN}名称:${NC} auth"
echo -e "${GREEN}目标:${NC} $COGNITO_DOMAIN"
echo ""
echo -e "${YELLOW}完成后按回车继续...${NC}"
read -r

# 验证 DNS 解析
echo ""
echo -e "${YELLOW}📋 正在验证 DNS 解析...${NC}"
sleep 5

if dig +short $DOMAIN | grep -q "cloudfront.net"; then
    echo -e "${GREEN}✅ DNS 解析正常${NC}"
else
    echo -e "${YELLOW}⚠️  DNS 可能尚未传播，请稍后重试${NC}"
fi

echo ""
echo -e "${GREEN}✅ 第三步完成${NC}"
echo ""

# 第四步：提示更新应用代码
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}第四步：更新应用代码${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}请更新 mobile/src/config/aws-config.ts:${NC}"
echo ""
echo -e "${GREEN}从:${NC}"
echo "  domain: \"us-east-11dgdnffb0.auth.us-east-1.amazoncognito.com\","
echo ""
echo -e "${GREEN}改为:${NC}"
echo "  domain: \"$DOMAIN\","
echo ""
echo -e "${YELLOW}然后保存文件并重新构建应用${NC}"
echo ""

# 完成
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 配置脚本执行完成！${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}下一步：${NC}"
echo "1. ✓ 更新应用代码（第四步）"
echo "2. ✓ 重新构建应用: npm run ios"
echo "3. ✓ 测试 Google 登录"
echo "4. ✓ 验证显示 $DOMAIN"
echo ""
echo -e "${BLUE}需要更多帮助？请查看：${NC}"
echo "- docs/AWS_COGNITO_CUSTOM_DOMAIN_SETUP.md"
echo "- docs/QUICK_SETUP.md"
echo ""

