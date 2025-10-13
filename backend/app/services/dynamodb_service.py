import boto3
from boto3.dynamodb.conditions import Key
from typing import List, Optional
from app.config import get_settings
import uuid
from datetime import datetime, timezone


class DynamoDBService:
    """DynamoDB数据库服务"""
    def __init__(self):
        settings=get_settings()
        # 创建DynamoDB客户端
        self.dynamodb=boto3.resource(
            "dynamodb",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key
        )
        # 获取表
        self.table=self.dynamodb.Table(settings.dynamodb_table_name)

    def create_diary(
        self, 
        user_id:str,
        original_content:str,
        polished_content:str,
        ai_feedback:str
    ) -> dict:
        """ 创建日记
        
        参数:
            user_id: 用户ID
            original_content: 原始内容
            polished_content: 润色后内容
            ai_feedback: AI反馈
        
        返回:
            创建的日记对象 """
        # 生成唯一ID和时间戳
        diary_id=str(uuid.uuid4())
        create_at=datetime.now(timezone.utc).isoformat()
        date=datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        # 构造要保存的数据
        item={
            'diaryId': diary_id,
            'userId':user_id,
            'createdAt':create_at,
            'date':date,
            'originalContent':original_content,
            'polishedContent': polished_content,
            'aiFeedback': ai_feedback
        }
        # 保存到DynamoDB

        try:
            self.table.put_item(Item=item)
            # 返回给前端的格式(转成下划线命名)
            return{ 
                'diary_id': diary_id,
                'user_id': user_id,
                'created_at': create_at,
                'date': date,
                'original_content': original_content,
                'polished_content': polished_content,
                'ai_feedback': ai_feedback

            }
        except Exception as e:
            print(f"保存日记失败:{str(e)}")
            raise
    def get_user_diaries(
        self,
        user_id: str,
        limit: int = 20
    ) -> List[dict]:
        """
        获取用户的日记列表
        
        参数:
            user_id: 用户ID
            limit: 返回数量
        
        返回:
            日记列表
        """
        try:
            # 查询该用户的所有日记
            response = self.table.query(
                KeyConditionExpression=Key('userId').eq(user_id),
                ScanIndexForward=False,  # 倒序排列(最新的在前)
                Limit=limit
            )
            
            # 转换格式
            diaries = []
            for item in response.get('Items', []):
                diaries.append({
                    'diary_id': item.get('diaryId', 'unknown'),
                    'user_id': item.get('userId', ''),
                    'created_at': item.get('createdAt', ''),
                    'date': item.get('date', ''),
                    'original_content': item.get('originalContent', ''),
                    'polished_content': item.get('polishedContent', ''),
                    'ai_feedback': item.get('aiFeedback', '')
                })
            
            return diaries
        except Exception as e:
            print(f"获取日记列表失败: {str(e)}")
            raise
    
    def get_diary_by_id(
        self,
        user_id: str,
        created_at: str
    ) -> Optional[dict]:
        """
        获取单条日记
        
        参数:
            user_id: 用户ID
            created_at: 创建时间
        
        返回:
            日记对象或None
        """
        try:
            response = self.table.get_item(
                Key={
                    'userId': user_id,
                    'createdAt': created_at
                }
            )
            
            item = response.get('Item')
            if not item:
                return None
            
            return {
                'diary_id': item.get('diaryId', 'unknown'),
                'user_id': item.get('userId', ''),
                'created_at': item.get('createdAt', ''),
                'date': item.get('date', ''),
                'original_content': item.get('originalContent', ''),
                'polished_content': item.get('polishedContent', ''),
                'ai_feedback': item.get('aiFeedback', '')
            }
        except Exception as e:
            print(f"获取日记失败: {str(e)}")
            raise