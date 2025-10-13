#!/usr/bin/env python3
"""
用authorization code换取token
"""
import sys
import requests
from urllib.parse import urlencode

# ===== 配置区域 (修改成你的实际值) =====
COGNITO_DOMAIN = "us-east-11dgdnffb0.auth.us-east-1.amazoncognito.com"
CLIENT_ID = "6e521vvi1g2a1efbf3l70o83k2"  # 替换成你的
REDIRECT_URI = "https://oauth.pstmn.io/v1/callback"
# ==========================================

def exchange_code_for_token(code_verifier, authorization_code):
    """用authorization code + code_verifier换取token"""
    token_url = f"https://{COGNITO_DOMAIN}/oauth2/token"
    
    data = {
        'grant_type': 'authorization_code',
        'client_id': CLIENT_ID,
        'code': authorization_code,
        'redirect_uri': REDIRECT_URI,
        'code_verifier': code_verifier
    }
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    print("🔄 正在用authorization code换取token...")
    print()
    
    response = requests.post(token_url, data=data, headers=headers)
    
    if response.status_code == 200:
        tokens = response.json()
        print("✅ 成功获取Token!")
        print("=" * 60)
        print("📋 Id Token (复制这个到Swagger):")
        print(tokens['id_token'])
        print()
        print("=" * 60)
        print("📊 完整响应:")
        print(f"Access Token: {tokens['access_token'][:50]}...")
        print(f"Refresh Token: {tokens['refresh_token'][:50]}...")
        print(f"Token Type: {tokens['token_type']}")
        print(f"Expires In: {tokens['expires_in']} 秒")
        print("=" * 60)
    else:
        print("❌ 错误!")
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.text}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("使用方法:")
        print("  python3 exchange_token.py <code_verifier> <authorization_code>")
        sys.exit(1)
    
    code_verifier = sys.argv[1]
    authorization_code = sys.argv[2]
    
    exchange_code_for_token(code_verifier, authorization_code)