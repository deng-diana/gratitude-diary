# 微信登录接入评估与配置指南

## 📋 接入评估

### ✅ 优势
1. **用户覆盖率高**：微信在中国有超过12亿用户，几乎所有中国用户都有微信账号
2. **用户体验好**：一键登录，无需记住密码
3. **已有基础**：您已有公司实体的微信开发者账号，节省注册时间

### ⚠️ 复杂度评估

**总体评估：中等复杂度（3-5天开发时间）**

#### 开发工作量分解：
1. **微信开放平台配置**（1-2小时）
   - 创建移动应用
   - 获取AppID和AppSecret
   - 配置授权回调域名

2. **iOS SDK集成**（4-6小时）
   - 安装微信SDK依赖
   - 配置Info.plist
   - 实现登录流程

3. **Android SDK集成**（4-6小时）
   - 安装微信SDK依赖
   - 配置AndroidManifest.xml
   - 实现登录流程

4. **后端集成**（4-6小时）
   - 接入微信OAuth API
   - 在Cognito中配置微信作为Identity Provider
   - 实现token交换逻辑

5. **前端UI调整**（2-3小时）
   - 添加微信登录按钮
   - 处理登录回调

**总计：约15-25小时开发时间（2-3个工作日）**

### 📝 前置条件检查清单

- [x] 已有微信开发者账号（公司实体）
- [ ] 应用已通过微信开放平台审核（需要提交审核材料）
- [ ] 有合法的应用域名用于回调URL
- [ ] 有应用的App Bundle ID（iOS）和Package Name（Android）

### ⚠️ 注意事项

1. **审核要求**：
   - 微信登录功能需要提交审核，审核时间通常为3-7个工作日
   - 需要提供应用的详细说明和使用场景

2. **回调域名**：
   - 需要配置合法的HTTPS回调域名
   - 可以是您的API域名或Cognito自定义域名

3. **SDK依赖**：
   - React Native需要使用第三方库（如`react-native-wechat`）
   - 需要原生代码配置（iOS和Android）

4. **Cognito配置**：
   - 需要在AWS Cognito中配置微信作为OIDC Identity Provider
   - 需要配置微信的授权端点、token端点等

---

## 🚀 接入步骤（详细指南）

### 第一步：微信开放平台配置

#### 1.1 创建移动应用

1. 登录 [微信开放平台](https://open.weixin.qq.com/)
2. 进入"管理中心" → "网站应用"或"移动应用"
3. 点击"创建移动应用"
4. 填写应用信息：
   - **应用名称**：您的应用名称
   - **应用简介**：简要描述应用功能
   - **应用图标**：上传应用图标（512x512像素）
   - **应用分类**：选择合适分类

#### 1.2 获取AppID和AppSecret

创建应用后，在应用详情页面可以找到：
- **AppID**：应用的唯一标识
- **AppSecret**：用于验证应用身份的密钥（请妥善保管）

#### 1.3 配置iOS平台

1. 在应用详情页面，点击"iOS平台"
2. 填写iOS配置信息：
   - **Bundle ID**：您的iOS应用的Bundle ID（如：`com.yourcompany.gratitudediary`）
   - **Universal Links**：配置您的应用的Universal Links（可选）

#### 1.4 配置Android平台

1. 在应用详情页面，点击"Android平台"
2. 填写Android配置信息：
   - **应用包名**：您的Android应用的包名（如：`com.yourcompany.gratitudediary`）
   - **应用签名**：上传应用的签名文件（用于验证）

#### 1.5 提交审核

填写完所有信息后，提交审核。审核通过后，AppID和AppSecret才会生效。

---

### 第二步：安装依赖

#### 2.1 React Native微信SDK

```bash
cd mobile
npm install react-native-wechat-lib
# 或者
npm install react-native-wechat
```

#### 2.2 iOS配置（使用CocoaPods）

```bash
cd ios
pod install
```

#### 2.3 Android配置

在`android/build.gradle`中添加：

```gradle
allprojects {
    repositories {
        // ... 其他仓库
        flatDir {
            dirs 'libs'
        }
    }
}
```

---

### 第三步：代码实现

#### 3.1 iOS配置

在`ios/YourApp/Info.plist`中添加：

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>wxYourAppID</string>
        </array>
    </dict>
</array>
```

在`ios/YourApp/AppDelegate.m`中添加：

```objc
#import <WXApi.h>

- (BOOL)application:(UIApplication *)application handleOpenURL:(NSURL *)url {
    return [WXApi handleOpenURL:url delegate:self];
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation {
    return [WXApi handleOpenURL:url delegate:self];
}
```

#### 3.2 Android配置

在`android/app/src/main/AndroidManifest.xml`中添加：

```xml
<activity
    android:name=".wxapi.WXEntryActivity"
    android:exported="true"
    android:taskAffinity="${applicationId}"
    android:launchMode="singleTask">
    <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <data android:scheme="wxYourAppID"/>
    </intent-filter>
</activity>
```

#### 3.3 前端实现

创建`mobile/src/services/wechatAuthService.ts`：

```typescript
import { NativeModules } from 'react-native';
import WeChat from 'react-native-wechat-lib';

const WECHAT_APP_ID = 'your_wechat_app_id'; // 从微信开放平台获取

export async function signInWithWeChat(): Promise<string> {
  try {
    // 注册微信SDK
    await WeChat.registerApp(WECHAT_APP_ID);
    
    // 发送登录请求
    const result = await WeChat.sendAuthRequest('snsapi_userinfo');
    
    if (result.code) {
      // 使用code换取access_token和openid
      return result.code;
    } else {
      throw new Error('微信登录失败');
    }
  } catch (error) {
    console.error('微信登录错误:', error);
    throw error;
  }
}
```

#### 3.4 后端实现

在`backend/app/routers/auth.py`中添加：

```python
from fastapi import APIRouter, HTTPException
import requests
import os

router = APIRouter()

WECHAT_APP_ID = os.getenv('WECHAT_APP_ID')
WECHAT_APP_SECRET = os.getenv('WECHAT_APP_SECRET')

class WeChatLoginRequest(BaseModel):
    code: str  # 微信返回的code

@router.post("/wechat", response_model=AuthResponse)
async def wechat_login(request: WeChatLoginRequest):
    """
    微信登录端点
    
    流程：
    1. 使用code换取access_token和openid
    2. 获取用户信息
    3. 在Cognito中创建或获取用户
    4. 返回Cognito tokens
    """
    try:
        # 1. 使用code换取access_token
        token_url = f"https://api.weixin.qq.com/sns/oauth2/access_token"
        token_params = {
            'appid': WECHAT_APP_ID,
            'secret': WECHAT_APP_SECRET,
            'code': request.code,
            'grant_type': 'authorization_code'
        }
        
        token_response = requests.get(token_url, params=token_params)
        token_data = token_response.json()
        
        if 'access_token' not in token_data:
            raise HTTPException(status_code=401, detail="获取微信token失败")
        
        access_token = token_data['access_token']
        openid = token_data['openid']
        
        # 2. 获取用户信息
        user_info_url = f"https://api.weixin.qq.com/sns/userinfo"
        user_params = {
            'access_token': access_token,
            'openid': openid
        }
        
        user_response = requests.get(user_info_url, params=user_params)
        user_data = user_response.json()
        
        if 'openid' not in user_data:
            raise HTTPException(status_code=401, detail="获取微信用户信息失败")
        
        # 3. 在Cognito中创建或获取用户（类似于Apple登录的逻辑）
        # ... 实现Cognito用户创建/认证逻辑 ...
        
        return AuthResponse(...)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"微信登录失败: {str(e)}")
```

---

### 第四步：AWS Cognito配置

#### 4.1 添加微信作为OIDC Identity Provider

1. 登录AWS控制台，进入Cognito
2. 选择您的User Pool
3. 进入"Sign-in experience" → "Federated identity provider sign-in"
4. 点击"Add identity provider"
5. 选择"OpenID Connect"
6. 填写配置：
   - **Provider name**：WeChat
   - **Client ID**：您的微信AppID
   - **Authorized scopes**：`snsapi_userinfo`
   - **Issuer URL**：`https://open.weixin.qq.com`

#### 4.2 配置属性映射

- `sub` → `cognito:username`
- `nickname` → `name`
- `headimgurl` → `picture`

---

### 第五步：前端UI集成

在`mobile/src/screens/LoginScreen.tsx`中添加微信登录按钮：

```typescript
import { signInWithWeChat } from '../services/wechatAuthService';

// 在buttonSection中添加
<TouchableOpacity
  style={[styles.button, styles.wechatButton]}
  onPress={handleWeChatSignIn}
  disabled={loading}
>
  <Ionicons name="logo-wechat" size={24} color="#07C160" />
  <Text style={styles.wechatButtonText}>
    {t("login.wechatSignIn")}
  </Text>
</TouchableOpacity>
```

---

## 📚 参考资料

1. [微信开放平台文档](https://developers.weixin.qq.com/doc/oplatform/Mobile_App/Access_Guide/iOS.html)
2. [微信登录接入指南](https://developers.weixin.qq.com/doc/oplatform/en/Website_App/WeChat_Login/Wechat_Login.html)
3. [AWS Cognito OIDC配置](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-oidc-idp.html)

---

## 🎯 总结

### 接入难度：⭐⭐⭐（中等）

**适合接入的情况**：
- ✅ 主要面向中国用户
- ✅ 已有微信开发者账号
- ✅ 有2-3天的开发时间
- ✅ 应用已通过或可以快速通过微信审核

**建议**：
1. 先完成用户名密码登录和注册功能（当前已实现）
2. 根据用户反馈决定是否需要接入微信登录
3. 如果需要，按照本指南逐步接入

### 下一步行动

1. 在微信开放平台创建应用并提交审核
2. 等待审核通过（3-7个工作日）
3. 按照本指南逐步实现微信登录功能
4. 测试并上线

---

## 💡 优化建议

1. **渐进式接入**：先完成基本功能，再逐步接入第三方登录
2. **用户数据备份**：建议所有用户都绑定邮箱，以防第三方登录失效
3. **多登录方式**：同时支持邮箱登录和微信登录，给用户更多选择

