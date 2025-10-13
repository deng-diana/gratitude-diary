#!/usr/bin/env python3
"""
Cognito SECRET_HASH 计算工具

用法:
    python3 calculate_secret_hash.py <username> <client_id> <client_secret>

示例:
    python3 calculate_secret_hash.py testuser@example.com 6k4udp23h92m7qdjeo5vpajln3 your_secret
"""

import hmac
import hashlib
import base64
import sys


def calculate_secret_hash(username: str, client_id: str, client_secret: str) -> str:
    """
    计算 Cognito SECRET_HASH
    
    公式: Base64(HMAC_SHA256(client_secret, username + client_id))
    
    参数:
        username: 用户名（通常是邮箱）
        client_id: Cognito App Client ID
        client_secret: Cognito App Client Secret
    
    返回:
        SECRET_HASH 字符串
    """
    # 拼接消息：username + client_id
    message = username + client_id
    
    # 使用 HMAC-SHA256 计算哈希
    dig = hmac.new(
        client_secret.encode('UTF-8'),
        msg=message.encode('UTF-8'),
        digestmod=hashlib.sha256
    ).digest()
    
    # Base64 编码
    return base64.b64encode(dig).decode()


def main():
    if len(sys.argv) != 4:
        print("❌ 参数错误！")
        print("")
        print("用法:")
        print("  python3 calculate_secret_hash.py <username> <client_id> <client_secret>")
        print("")
        print("示例:")
        print("  python3 calculate_secret_hash.py testuser@example.com 6k4udp23h92m7qdjeo5vpajln3 your_secret")
        sys.exit(1)
    
    username = sys.argv[1]
    client_id = sys.argv[2]
    client_secret = sys.argv[3]
    
    try:
        secret_hash = calculate_secret_hash(username, client_id, client_secret)
        print(secret_hash)
    except Exception as e:
        print(f"❌ 计算失败: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

