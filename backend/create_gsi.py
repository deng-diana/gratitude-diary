#!/usr/bin/env python3
"""
创建 DynamoDB GSI 索引
在生产环境中，应该使用 Terraform 或 CloudFormation 来管理基础设施
这里提供一个临时的 Python 脚本
"""

import boto3
from botocore.exceptions import ClientError

# 配置
TABLE_NAME = "GratitudeDiaries"
INDEX_NAME = "diaryId-index"
PARTITION_KEY = "diaryId"

def create_gsi():
    """创建全局二级索引"""
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.Table(TABLE_NAME)
    
    try:
        print(f"正在为表 {TABLE_NAME} 创建 GSI 索引 {INDEX_NAME}...")
        
        # 创建 GSI
        table.meta.client.update_table(
            TableName=TABLE_NAME,
            AttributeDefinitions=[
                {
                    'AttributeName': PARTITION_KEY,
                    'AttributeType': 'S'
                },
            ],
            GlobalSecondaryIndexUpdates=[
                {
                    'Create': {
                        'IndexName': INDEX_NAME,
                        'KeySchema': [
                            {
                                'AttributeName': PARTITION_KEY,
                                'KeyType': 'HASH'  # Partition key
                            },
                        ],
                        'Projection': {
                            'ProjectionType': 'ALL'  # 包含所有属性
                        },
                        'ProvisionedThroughput': {
                            'ReadCapacityUnits': 5,
                            'WriteCapacityUnits': 5
                        }
                    }
                }
            ]
        )
        
        print(f"✅ GSI 索引 {INDEX_NAME} 创建成功！")
        print("⚠️  索引可能需要几分钟时间来构建...")
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"❌ GSI {INDEX_NAME} 已存在")
        elif e.response['Error']['Code'] == 'ValidationException':
            print(f"❌ 验证错误: {e.response['Error']['Message']}")
        else:
            print(f"❌ 创建失败: {e}")
            raise
    
    except Exception as e:
        print(f"❌ 发生错误: {e}")
        raise

if __name__ == "__main__":
    create_gsi()
