import jwt
import requests
from jwt.algorithms import RSAAlgorithm
from fastapi import HTTPException, Header
from functools import lru_cache
from typing import Optional, Dict
from app.config import get_settings

class CognitoJWTVerifier:
    """Cognito JWT Token验证器"""
    
    def __init__(self):
        self.settings = get_settings()
        self.region = self.settings.cognito_region
        self.user_pool_id = self.settings.cognito_user_pool_id
        self.app_client_id = self.settings.cognito_app_client_id
        
        # JWT公钥URL
        self.keys_url = (
            f"https://cognito-idp.{self.region}.amazonaws.com/"
            f"{self.user_pool_id}/.well-known/jwks.json"
        )
        
        # 缓存公钥
        self._public_keys = None
    
    def get_public_keys(self) -> Dict:
        """
        获取Cognito公钥
        用于验证JWT签名
        """
        if self._public_keys is None:
            response = requests.get(self.keys_url)
            response.raise_for_status()
            self._public_keys = response.json()
        
        return self._public_keys
    
    def verify_token(self, token: str) -> Dict:
        """
        验证JWT Token
        
        参数:
            token: JWT token字符串
        
        返回:
            解码后的token payload (包含用户信息)
        
        抛出:
            HTTPException: Token无效时
        """
        try:
            # 1. 解码token header (不验证签名)
            headers = jwt.get_unverified_header(token)
            kid = headers['kid']
            
            # 2. 获取对应的公钥
            public_keys = self.get_public_keys()
            key = None
            for k in public_keys['keys']:
                if k['kid'] == kid:
                    key = k
                    break
            
            if not key:
                raise HTTPException(
                    status_code=401,
                    detail="无效的token: 找不到公钥"
                )
            
            # 3. 转换公钥格式
            public_key = RSAAlgorithm.from_jwk(key)
            
            # 4. 验证token
            payload = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                audience=self.app_client_id,  # 验证audience
                options={
                    "verify_signature": True,
                    "verify_exp": True,  # 验证过期时间
                    "verify_aud": True,  # 验证audience
                }
            )
            
            # 5. 验证token类型 (id_token 或 access_token)
            token_use = payload.get('token_use')
            if token_use not in ['id', 'access']:
                raise HTTPException(
                    status_code=401,
                    detail="无效的token类型"
                )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=401,
                detail="Token已过期,请重新登录"
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=401,
                detail=f"无效的token: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=401,
                detail=f"Token验证失败: {str(e)}"
            )

# 创建全局实例
_jwt_verifier = CognitoJWTVerifier()

async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> Dict:
    """
    从请求头获取并验证用户
    
    前端需要在Header添加: Authorization: Bearer <token>
    
    返回:
        用户信息字典,包含:
        - sub: 用户唯一ID (Cognito User ID)
        - email: 邮箱
        - name: 姓名
        - email_verified: 邮箱是否验证
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="未提供认证token,请在Header添加: Authorization: Bearer <token>"
        )
    
    # 检查Bearer格式
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise HTTPException(
            status_code=401,
            detail="认证格式错误,应为: Bearer <token>"
        )
    
    token = parts[1]
    
    # 验证token
    payload = _jwt_verifier.verify_token(token)
    
    # 提取用户信息
    user_info = {
        'user_id': payload.get('sub'),  # Cognito用户唯一ID
        'email': payload.get('email', ''),
        'name': payload.get('name', ''),
        'email_verified': payload.get('email_verified', False),
        'username': payload.get('cognito:username', payload.get('sub')),
    }
    
    # 如果是社交登录,可能有额外字段
    if 'identities' in payload:
        # 社交登录用户
        identities = payload['identities']
        if isinstance(identities, str):
            import json
            identities = json.loads(identities)
        
        if identities:
            user_info['provider'] = identities[0].get('providerName', 'Unknown')
    
    return user_info

async def get_optional_user(
    authorization: Optional[str] = Header(None)
) -> Optional[Dict]:
    """
    可选的用户认证
    如果有token就验证,没有就返回None
    用于某些不强制登录的接口
    """
    if not authorization:
        return None
    
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None