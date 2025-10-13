from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.openapi.utils import get_openapi
from app.routers import diary
from app.config import get_settings

# 获取配置
settings=get_settings()

# 定义HTTP Bearer安全方案
# 这会让Swagger UI显示🔓 Authorize按钮
security = HTTPBearer(
    scheme_name="Bearer Authentication",
    description="输入从Cognito获取的JWT token"
)

# 创建FastAPI应用, 配置标题和描述
app=FastAPI(
    title=settings.app_name,
    description="感恩日记后端API - 记录生活中的美好时刻",
    version="1.0.0",
    docs_url="/docs",# Swagger文档地址
    redoc_url="/redoc"# ReDoc文档地址
)

# 自定义OpenAPI schema - 这会让Swagger显示🔓按钮
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    # 添加Bearer认证定义
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "请输入从AWS Cognito获取的JWT token (只输入token,不要加Bearer前缀)"
        }
    }
    
    # 标记哪些路由需要认证
    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            # /diary开头的所有路由都需要认证
            if path.startswith("/diary"):
                openapi_schema["paths"][path][method]["security"] = [
                    {"BearerAuth": []}
                ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# 应用自定义OpenAPI schema
app.openapi = custom_openapi


# 配置CORS(允许前端跨域访问), CORS: Cross-Origin Resource Sharing,允许不同域名的网站访问API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 生产环境改成具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(
    diary.router,
    prefix="/diary",#所有diary.router的路径前加/diary
    tags=["日记管理"]
)
# 根路径
@app.get("/", tags=["健康检查"])
async def root():
    """API根路径""" 
    return {
        "message":"欢迎使用感恩日记API",
        "version":"1.0.0",
        "docs":"/docs"
    }
# 健康检查端点
@app.get("/heath",tags=["健康检查"])
async def health_check():
    """检查API是否正常运行"""
    return {"status":"healthy"}