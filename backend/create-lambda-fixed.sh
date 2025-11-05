#!/bin/bash

# 直接从.env读取特定变量（不用source）
COGNITO_USER_POOL_ID=$(grep COGNITO_USER_POOL_ID .env | cut -d '=' -f2)
COGNITO_CLIENT_ID=$(grep COGNITO_CLIENT_ID .env | cut -d '=' -f2)
OPENAI_API_KEY=$(grep OPENAI_API_KEY .env | cut -d '=' -f2)
S3_BUCKET_NAME=$(grep S3_BUCKET_NAME .env | cut -d '=' -f2)
DYNAMODB_TABLE_NAME=$(grep DYNAMODB_TABLE_NAME .env | cut -d '=' -f2)

# 去除可能的引号和空格
COGNITO_USER_POOL_ID=$(echo $COGNITO_USER_POOL_ID | tr -d '"' | tr -d ' ')
COGNITO_CLIENT_ID=$(echo $COGNITO_CLIENT_ID | tr -d '"' | tr -d ' ')
OPENAI_API_KEY=$(echo $OPENAI_API_KEY | tr -d '"' | tr -d ' ')
S3_BUCKET_NAME=$(echo $S3_BUCKET_NAME | tr -d '"' | tr -d ' ')
DYNAMODB_TABLE_NAME=$(echo $DYNAMODB_TABLE_NAME | tr -d '"' | tr -d ' ')

echo "读取到的配置："
echo "COGNITO_USER_POOL_ID: ${COGNITO_USER_POOL_ID:0:20}..."
echo "COGNITO_CLIENT_ID: ${COGNITO_CLIENT_ID:0:20}..."
echo "S3_BUCKET_NAME: $S3_BUCKET_NAME"
echo "DYNAMODB_TABLE_NAME: $DYNAMODB_TABLE_NAME"
echo ""

# 创建Lambda函数
aws lambda create-function \
  --function-name gratitude-diary-api \
  --package-type Image \
  --code ImageUri=633404778395.dkr.ecr.us-east-1.amazonaws.com/gratitude-diary:lambda-amd64 \
  --role arn:aws:iam::633404778395:role/gratitude-diary-lambda-role \
  --architectures x86_64 \
  --timeout 60 \
  --memory-size 1024 \
  --environment Variables="{COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID,COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID,OPENAI_API_KEY=$OPENAI_API_KEY,S3_BUCKET_NAME=$S3_BUCKET_NAME,DYNAMODB_TABLE_NAME=$DYNAMODB_TABLE_NAME}" \
  --region us-east-1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Lambda函数创建成功！"
    echo ""
    echo "下一步：创建Function URL"
else
    echo ""
    echo "❌ Lambda函数创建失败"
    exit 1
fi
