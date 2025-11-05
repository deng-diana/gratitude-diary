#!/bin/bash

# 读取配置
COGNITO_USER_POOL_ID=$(grep COGNITO_USER_POOL_ID .env | cut -d '=' -f2 | tr -d '"' | tr -d ' ')
COGNITO_CLIENT_ID=$(grep COGNITO_CLIENT_ID .env | cut -d '=' -f2 | tr -d '"' | tr -d ' ')
OPENAI_API_KEY=$(grep OPENAI_API_KEY .env | cut -d '=' -f2 | tr -d '"' | tr -d ' ')
S3_BUCKET_NAME=$(grep S3_BUCKET_NAME .env | cut -d '=' -f2 | tr -d '"' | tr -d ' ')
DYNAMODB_TABLE_NAME=$(grep DYNAMODB_TABLE_NAME .env | cut -d '=' -f2 | tr -d '"' | tr -d ' ')

echo "正在更新Lambda环境变量..."
echo ""

aws lambda update-function-configuration \
  --function-name gratitude-diary-api \
  --environment Variables="{COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID,COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID,OPENAI_API_KEY=$OPENAI_API_KEY,S3_BUCKET_NAME=$S3_BUCKET_NAME,DYNAMODB_TABLE_NAME=$DYNAMODB_TABLE_NAME}" \
  --region us-east-1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 环境变量更新成功！"
    echo ""
    echo "Lambda函数已完全配置好！"
else
    echo ""
    echo "❌ 更新失败"
    exit 1
fi
