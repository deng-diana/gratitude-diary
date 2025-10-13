from openai import OpenAI
from fastapi import UploadFile
import os
from app.config import get_settings

class OpenAIService:
    """OpenAI服务类"""
    
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)
    
    def transcribe_audio(self, audio: UploadFile) -> str:
        """
        语音转文字
        
        参数:
            audio: 上传的音频文件
        返回:
            转写的文本
        """
        try:
            # 调用Whisper API
            transcription = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio.file,
                language="zh"  # 指定中文,提高准确率
            )
            return transcription.text
        except Exception as e:
            print(f"语音转文字失败: {str(e)}")
            raise
    
    def polish_text(self, text: str) -> str:
        """
        润色文本
        
        参数:
            text: 原始文本
        返回:
            润色后的文本
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # 使用mini版本,便宜15倍
                messages=[
                    {
                        "role": "system",
                        "content": """你是一个温柔的文字润色助手。
将用户的口语化感恩日记润色成流畅的文字,要求:
1. 保持原意和情感,不要过度修改
2. 修正明显的语法错误
3. 让表达更清晰但不要太文艺腔
4. 保持真诚朴实的语气
5. 不要添加用户没说的内容"""
                    },
                    {
                        "role": "user",
                        "content": text
                    }
                ],
                temperature=0.7,  # 控制创造性,0-2之间,越高越随机
                max_tokens=500    # 最多生成500个token
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"文本润色失败: {str(e)}")
            # 如果失败,返回原文
            return text
    
    def generate_feedback(self, diary_content: str) -> str:
        """
        生成AI反馈
        
        参数:
            diary_content: 日记内容
        返回:
            AI的温暖回应
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """你是用户的感恩日记陪伴者,名字叫"小光"。
用户刚分享了一段感恩日记,请给出简短温暖的回应(2-3句话)。
性格特点:
- 温暖但不矫情,像个善解人意的朋友
- 偶尔幽默,但知道什么时候该认真
- 不说教,而是轻轻点拨

回应风格:
1. 长度: 严格控制在30-50字
2. 语气: 用"你"称呼,像朋友聊天,不要太正式
3. 情感: 真诚共情,但避免过度煽情
4. 变化: 不要每次都用同样的句式,保持新鲜感
5. emoji: 每次回应只用0-1个emoji,放在合适的位置

回应策略:
- 如果日记很简短,就简单肯定认同
- 如果日记有细节,可以点出一个小亮点
- 如果感受到负面情绪,温柔地给予支持
- 偶尔(20%概率)轻轻延展思考,但不要问问题
- 避免使用"真好""真棒""继续加油"等空泛词汇

禁止:
❌ 不要问问题(比如"你觉得呢?")
❌ 不要建议(比如"你可以...")
❌ 不要说教(比如"我们应该...")
❌ 不要重复日记内容
❌ 不要用感叹号超过1个"""
                    },
                    {
                        "role": "user",
                        "content": f"我的感恩日记:\n{diary_content}"
                    }
                ],
                temperature=0.8,  # 稍高的temperature让回应更多样
                max_tokens=150
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"生成反馈失败: {str(e)}")
            # 如果失败,返回默认回应
            return "感谢你的分享,记录感恩的时刻真的很美好 😊"