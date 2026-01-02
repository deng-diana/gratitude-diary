import json
import re
from typing import Optional

from fastapi import HTTPException


def validate_audio_quality(duration: int, audio_size: int) -> None:
    """
    Validate audio length and size for basic quality.
    """
    print(f"🔍 开始音频质量验证 - 时长: {duration}秒, 大小: {audio_size} bytes")

    if duration < 5:
        raise HTTPException(
            status_code=400,
            detail="录音时间太短，请至少录制5秒以上的内容。建议说一个完整的句子。",
        )

    if duration > 600:
        raise HTTPException(status_code=400, detail="录音时间过长，请控制在10分钟以内")

    if audio_size < 1000:
        raise HTTPException(status_code=400, detail="音频文件太小，可能没有录制到有效内容")

    print("✅ 音频质量验证通过")


def normalize_transcription(text: str) -> str:
    """
    Normalize transcription by stripping whitespace and punctuation.
    """
    if not text:
        return ""

    normalized = re.sub(r"[\s\n\r\t]+", "", text)
    normalized = re.sub(r"[.,!?;:，。！？；：\"''\"'\-_/\\…]+", "", normalized)

    return normalized


def validate_transcription(transcription: str, duration: Optional[int] = None) -> None:
    """
    Validate transcription quality by normalized length and density.
    """
    print("🔍 开始转录结果验证...")
    print(f"🔍 原始转录结果: '{transcription}'")

    normalized = normalize_transcription(transcription)
    print(f"🔍 标准化后转录结果: '{normalized}' (长度: {len(normalized)})")

    if len(normalized) < 3:
        print(f"❌ 转录内容为空或无效（标准化后长度: {len(normalized)}）")
        raise HTTPException(
            status_code=400,
            detail=json.dumps({"code": "EMPTY_TRANSCRIPT", "message": "No valid speech detected."}),
        )

    print(f"✅ 转录结果验证通过 - 内容: {transcription[:50]}...")
