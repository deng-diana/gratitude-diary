from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List, Dict # 添加Dict
from app.models.diary import DiaryCreate, DiaryResponse
from app.services.openai_service import OpenAIService
import uuid
from datetime import datetime, timezone
from app.services.dynamodb_service import DynamoDBService  # 新增
from app.utils.cognito_auth import get_current_user  # 改成新的

# 创建路由器
router = APIRouter()
db_service = DynamoDBService()


# 获取OpenAI服务实例的函数(延迟初始化,避免启动时就创建连接)
def get_openai_service():
    """获取OpenAI服务实例"""
    return OpenAIService()

@router.post("/text", response_model=DiaryResponse, summary="创建文字日记")
async def create_text_diary(
    diary: DiaryCreate,
    user: Dict=Depends(get_current_user)):
    """
    创建文字日记
    """
    try:
        # 获取服务实例
        openai_service = get_openai_service()
        
        # 1. AI润色
        polished = openai_service.polish_text(diary.content)
        
        # 2. 生成AI反馈
        feedback = openai_service.generate_feedback(polished)
        
        # 3. 保存到DynamoDB (替代原来的fake_db.append)
        diary_obj = db_service.create_diary(
            user_id=user['user_id'],
            original_content=diary.content,
            polished_content=polished,
            ai_feedback=feedback
        )
        
        return diary_obj
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建日记失败: {str(e)}")

@router.post("/voice", response_model=DiaryResponse, summary="创建语音日记")
async def create_voice_diary(
    audio: UploadFile = File(...),
    user: Dict=Depends(get_current_user)):
    """
    创建语音日记
    - **audio**: 音频文件(支持mp3, m4a, wav等格式)
    """
    try:
        # 获取服务实例
        openai_service = get_openai_service()
        
        # 1. 检查文件类型
        if not audio.content_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail="请上传音频文件")
        
        # 2. 语音转文字
        transcription = openai_service.transcribe_audio(audio)
        
        # 3. AI润色
        polished = openai_service.polish_text(transcription)
        
        # 4. 生成AI反馈
        feedback = openai_service.generate_feedback(polished)
        
        # 5. 保存到DynamoDB
        diary_obj = db_service.create_diary(
            user_id=user['user_id'],# 改这里
            original_content=transcription,
            polished_content=polished,
            ai_feedback=feedback
        )
        return diary_obj
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理语音失败: {str(e)}")

@router.get("/list", response_model=List[DiaryResponse], summary="获取日记列表")
async def get_diaries(
    limit: int = 20,
    user: Dict = Depends(get_current_user)  # 改这里
):
    """获取日记列表"""
    try:
        diaries = db_service.get_user_diaries(user['user_id'], limit)  # 改这里
        return diaries
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取日记列表失败: {str(e)}")