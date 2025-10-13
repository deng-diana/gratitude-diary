from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """应用配置"""
    
    # OpenAI配置
    openai_api_key: str
    
    # AWS配置
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    dynamodb_table_name: str = "GratitudeDiaries"
    
    # Cognito配置 (新增)
    cognito_region: str = "us-east-1"
    cognito_user_pool_id: str  # us-east-1_xxxxxxxxx
    cognito_app_client_id: str  # 7xxxxxxxxxxxxxxxxxxxxx
    cognito_app_client_secret: str = ""  # 可选
    
    # 应用配置
    app_name: str = "Gratitude Diary API"
    debug: bool = True
    
    class Config:
        env_file = ".env"  # 从.env文件读取配置
        case_sensitive = False  # 允许环境变量名称不区分大小写
        extra = "ignore"  # 忽略额外的字段，避免验证错误

@lru_cache()
def get_settings():
    """获取配置(单例模式)"""
    return Settings()