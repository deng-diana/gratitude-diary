"""
S3文件上传服务

负责:
- 上传音频文件到S3
- 生成公开访问URL
"""

import boto3
from ..config import get_settings
import uuid
from typing import BinaryIO


class S3Service:
    """S3文件存储服务"""
    
    def __init__(self):
        # 获取配置
        settings = get_settings()
    
        
        # 创建S3客户端
        # 在Lambda环境中，boto3会自动使用IAM角色凭证
        self.s3_client = boto3.client(
            's3',
            region_name=settings.aws_region
        )
        
        # S3桶名
        self.bucket_name = settings.s3_bucket_name

    def upload_audio(
        self,
        file_content: bytes,
        file_name: str,
        content_type: str = 'audio/m4a'
    ) -> str:
        """
        上传音频文件到S3
        
        参数:
            file_content: 文件的二进制内容
            file_name: 原始文件名（如：recording.m4a）
            content_type: 文件类型（默认audio/m4a）
        
        返回:
            S3文件的公开URL
        """
        
        # 第1步：生成唯一的文件名
        # 例如：audio/abc123-recording.m4a
        unique_id = str(uuid.uuid4())[:8]  # 取前8位
        s3_key = f"audio/{unique_id}-{file_name}"
        
        try:
            # 第2步：上传到S3（设置为公开可读）
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
            )
            
            # 第3步：生成公开URL（不需要签名，直接访问）
            # 前提：Bucket策略允许公开读取
            url = f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
            
            print(f"✅ 文件上传成功: {url}")
            return url
            
        except Exception as e:
            print(f"❌ S3上传失败: {str(e)}")
            raise