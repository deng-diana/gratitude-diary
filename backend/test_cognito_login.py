"""
测试Cognito登录 (Authorization Code + PKCE)
"""
import base64
import hashlib
import secrets
import webbrowser
from urllib.parse import urlencode

# ===== 配置区域 (修改成你的实际值) =====
COGNITO_DOMAIN = "us-east-11dgdnffb0.auth.us-east-1.amazoncognito.com"
CLIENT_ID = "6e521vvi1g2a1efbf3l70o83k2"  # 替换成你的
REDIRECT_URI = "https://oauth.pstmn.io/v1/callback"
# ==========================================

def generate_pkce_pair():
    """生成PKCE的code_verifier和code_challenge"""
    # 1. 生成code_verifier (43-128个字符的随机字符串)
    code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8')
    code_verifier = code_verifier.rstrip('=')  # 移除padding
    
    # 2. 生成code_challenge (code_verifier的SHA256哈希)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode('utf-8')).digest()
    ).decode('utf-8')
    code_challenge = code_challenge.rstrip('=')
    
    return code_verifier, code_challenge

def get_authorization_url():
    """生成Cognito授权URL"""
    code_verifier, code_challenge = generate_pkce_pair()
    
    params = {
        'client_id': CLIENT_ID,
        'response_type': 'code',
        'scope': 'email openid profile',
        'redirect_uri': REDIRECT_URI,
        'code_challenge': code_challenge,
        'code_challenge_method': 'S256'
    }
    
    url = f"https://{COGNITO_DOMAIN}/oauth2/authorize?{urlencode(params)}"
    
    print("=" * 60)
    print("🔐 Cognito Authorization Code + PKCE 测试")
    print("=" * 60)
    print()
    print("📋 Code Verifier (保存这个,等会用):")
    print(code_verifier)
    print()
    print("🔗 授权URL:")
    print(url)
    print()
    print("=" * 60)
    print("📖 使用步骤:")
    print("1. 浏览器会自动打开上面的URL")
    print("2. 登录你的账号 (testuser@example.com / TestPass123!)")
    print("3. 登录成功后会跳转到: https://example.com?code=xxx")
    print("4. 复制URL中 code= 后面的值")
    print("5. 运行下面的命令获取token:")
    print()
    print(f"   python3 exchange_token.py {code_verifier} <你复制的code>")
    print("=" * 60)
    
    return url, code_verifier

if __name__ == "__main__":
    url, code_verifier = get_authorization_url()
    
    # 自动在浏览器打开
    print("\n正在打开浏览器...")
    webbrowser.open(url)