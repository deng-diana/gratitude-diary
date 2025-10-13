"""
AWS Lambda处理器

这个文件的作用:
把FastAPI应用变成Lambda能理解的格式

就像一个"翻译器":
- Lambda说: "有人访问了API!"
- lambda_handler翻译给FastAPI: "处理这个HTTP请求"
- FastAPI处理完返回结果
- lambda_handler再翻译回Lambda能理解的格式
"""

from mangum import Mangum
from app.main import app

# Mangum是一个"适配器"
# 它把ASGI应用(FastAPI)转换成Lambda能用的格式
handler = Mangum(app, lifespan="off")

# 为什么lifespan="off"?
# Lambda每次只处理一个请求,处理完就休眠
# 不需要FastAPI的startup/shutdown事件