from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
import os

class Settings(BaseSettings):
    """应用配置"""
    
    # OpenAI配置（可选，某些端点不需要）
    openai_api_key: Optional[str] = ""
    
    # AWS配置
    aws_region: str = "us-east-1"
    #aws_access_key_id: str = ""
    #aws_secret_access_key: str = ""
    dynamodb_table_name: str = "GratitudeDiaries"
    s3_bucket_name: str = ""  # S3存储桶名称
    
    # Cognito配置 (新增)
    cognito_region: str = "us-east-1"
    cognito_user_pool_id: Optional[str] = ""  # us-east-1_xxxxxxxxx
    cognito_client_id: Optional[str] = ""  # 7xxxxxxxxxxxxxxxxxxxxx
    cognito_app_client_secret: str = ""  # 可选
    
    # 应用配置
    app_name: str = "Gratitude Diary API"
    debug: bool = True
    
    class Config:
        env_file = ".env"  # 从.env文件读取配置（Lambda环境中通常不存在，从环境变量读取）
        case_sensitive = False  # 允许环境变量名称不区分大小写
        extra = "ignore"  # 忽略额外的字段，避免验证错误

@lru_cache()
def get_settings():
    """获取配置(单例模式)"""
    try:
        settings = Settings()
        print(f"✅ 配置加载成功:")
        print(f"   - 表名: {settings.dynamodb_table_name}")
        print(f"   - 区域: {settings.aws_region}")
        print(f"   - Cognito Pool ID: {settings.cognito_user_pool_id[:20] if settings.cognito_user_pool_id else 'N/A'}...")
        return settings
    except Exception as e:
        print(f"❌ 配置加载失败: {str(e)}")
        import traceback
        traceback.print_exc()
        # 在 Lambda 环境中，尝试从环境变量直接读取
        return Settings(
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            dynamodb_table_name=os.getenv("DYNAMODB_TABLE_NAME", "GratitudeDiaries"),
            aws_region=os.getenv("AWS_REGION", "us-east-1"),
            cognito_user_pool_id=os.getenv("COGNITO_USER_POOL_ID", ""),
            cognito_client_id=os.getenv("COGNITO_CLIENT_ID", ""),
            s3_bucket_name=os.getenv("S3_BUCKET_NAME", "")
        )