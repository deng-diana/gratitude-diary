# iOS Push Notifications 配置指南

## 问题
iOS 构建失败，因为 Provisioning Profile 不支持 Push Notifications capability。

## 解决方案：在 Apple Developer 中启用 Push Notifications

### 步骤 1: 登录 Apple Developer Portal
1. 访问 https://developer.apple.com/account
2. 使用你的 Apple Developer 账号登录

### 步骤 2: 找到你的 App ID
1. 进入 **Certificates, Identifiers & Profiles**
2. 点击左侧 **Identifiers**
3. 搜索并找到：`com.stillkindailab.gratitudediary`

### 步骤 3: 启用 Push Notifications
1. 点击你的 App ID (`com.stillkindailab.gratitudediary`)
2. 在 **Capabilities** 部分，找到 **Push Notifications**
3. 勾选 **Push Notifications** 复选框
4. 点击右上角 **Save** 保存

### 步骤 4: 配置 Push Notification 证书（可选，如果使用 APNs）
如果你计划使用 Apple Push Notification service (APNs)，需要：
1. 在 **Push Notifications** 部分点击 **Configure**
2. 创建 Development 和 Production SSL 证书
3. 下载证书（EAS 也可以自动管理）

### 步骤 5: 让 EAS 重新生成 Provisioning Profile
EAS Build 会自动检测 Apple Developer 中的更改，但可能需要：
1. 等待几分钟让 Apple 同步更改
2. 重新触发构建

### 步骤 6: 重新构建
```bash
cd mobile
eas build --platform ios --profile production
```

## 方案二：临时禁用推送通知（如果暂时不需要）

如果暂时不需要推送通知功能，可以临时移除相关配置：

### 修改 app.json
1. 移除 `UIBackgroundModes` 中的 `"remote-notification"`
2. 移除或注释掉 `expo-notifications` 插件

**注意**：这会禁用应用的推送通知功能，包括每日提醒功能。

## 验证
构建成功后，检查：
- iOS 应用可以正常安装
- 推送通知功能正常工作（如果启用了方案一）
