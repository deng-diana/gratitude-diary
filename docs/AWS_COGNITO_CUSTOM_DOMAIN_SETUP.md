# 🎯 AWS Cognito 自定义域名配置指南

## 📋 概述

本指南将帮助你将 AWS Cognito 的默认域名 `us-east-11dgdnffb0.auth.us-east-1.amazoncognito.com` 替换为你的自定义域名 `thankly.app`，提升品牌一致性和用户信任度。

## ✅ 配置后的效果

**配置前：**

```
继续前往 us-east-11dgdnffb0.auth.us-east-1.amazoncognito.com
```

**配置后：**

```
继续前往 auth.thankly.app  ✨
```

---

## 🚀 完整配置步骤

### 第一步：准备 SSL 证书 (AWS Certificate Manager)

**⏰ 预计时间：5-10 分钟**

1. **登录 AWS 控制台**

   - 访问 https://console.aws.amazon.com
   - 选择区域：**美国东部（弗吉尼亚北部）us-east-1** ⚠️ 必须选择这个区域

2. **创建 SSL 证书**

   - 在顶部搜索栏输入 "Certificate Manager"
   - 点击左侧 "证书"，然后 "请求证书"
   - 选择 "请求公有证书"
   - 点击 "下一步"

3. **填写域名信息**

   - **完全限定域名 (FQDN)：** `auth.thankly.app`
   - 如果需要通配符证书（可选）：`*.thankly.app`
   - 点击 "请求证书"

4. **验证域名所有权**
   - 选择验证方法：**DNS 验证** (推荐)
   - AWS 会提供 DNS 记录（CNAME）
   - 在你的域名提供商（如 Cloudflare、GoDaddy）添加这些记录
   - 等待验证完成（通常 5-30 分钟）

---

### 第二步：在 Cognito 中配置自定义域名

**⏰ 预计时间：5 分钟**

1. **进入 Cognito 控制台**

   - 在 AWS 控制台搜索 "Cognito"
   - 选择 "用户池"
   - 找到你的用户池：`us-east-1_1DgDNffb0`
   - 点击进入

2. **配置自定义域名**

   - 点击左侧 "应用程序集成"
   - 找到 "域名" 部分
   - 点击 "添加自定义域"

3. **设置域名和证书**

   - **子域名前缀：** `auth` (或其他你喜欢的名字)
   - **完整域名：** `auth.thankly.app`
   - **ACM 证书：** 选择第一步创建的证书
   - 点击 "创建自定义域"

4. **等待部署**
   - AWS 会分配一个 CloudFront 域名
   - 部署过程通常需要 5-10 分钟
   - 状态变为 "已激活" 即完成

---

### 第三步：配置 DNS 记录

**⏰ 预计时间：5 分钟**

1. **获取 CloudFront 别名**

   - 在 Cognito 域名设置中，复制 AWS 提供的 CloudFront 分配域名
   - 格式类似：`d1234567890.cloudfront.net`

2. **在你的 DNS 提供商添加 CNAME**

   **如果使用 Cloudflare：**

   ```
   类型：CNAME
   名称：auth
   目标：d1234567890.cloudfront.net
   TTL：自动
   ```

   **如果使用 GoDaddy 或其他提供商：**

   ```
   主机：auth
   类型：CNAME
   值：d1234567890.cloudfront.net
   TTL：600
   ```

3. **等待 DNS 传播**
   - 通常在 5-30 分钟内生效
   - 可使用 https://www.whatsmydns.net 检查传播状态

---

### 第四步：更新应用配置

**⏰ 预计时间：2 分钟**

更新 `mobile/src/config/aws-config.ts` 文件：

```typescript
const awsConfig = {
  region: "us-east-1",
  userPoolId: "us-east-1_1DgDNffb0",
  userPoolWebClientId: "6e521vvi1g2a1efbf3l70o83k2",

  oauth: {
    // ✅ 修改这里：使用自定义域名
    domain: "auth.thankly.app", // 替换原来的长域名

    scope: ["email", "openid", "profile"],
    redirectSignIn: "myapp://callback",
    redirectSignOut: "myapp://signout",
    responseType: "code",
  },
};
```

---

### 第五步：验证配置

**⏰ 预计时间：5 分钟**

1. **测试自定义域名**

   - 在浏览器访问：`https://auth.thankly.app`
   - 应该看到 AWS Cognito 的登录页面
   - 确保浏览器显示 SSL 证书有效（锁定图标）

2. **测试应用登录**
   - 重新构建应用：`npm run ios`
   - 尝试 Google 登录
   - 检查登录页面是否显示 `auth.thankly.app`

---

## 🎉 完成后效果

用户进行 Google 登录时，会看到：

```
┌─────────────────────────────────────────┐
│  使用 Google 账号登录                    │
│                                         │
│  继续前往 auth.thankly.app ✓            │
│                                         │
│  [邮箱输入框]                           │
│  [下一步按钮]                           │
└─────────────────────────────────────────┘
```

而不是之前的：

```
继续前往 us-east-11dgdnffb0.auth.us-east-1.amazoncognito.com
```

---

## ⚠️ 常见问题排查

### 问题 1：证书验证失败

**原因：** DNS 记录未正确配置
**解决：** 检查 DNS 提供商是否正确添加 CNAME 记录

### 问题 2：自定义域名无法访问

**原因：** DNS 传播未完成
**解决：** 等待 30 分钟，使用 https://www.whatsmydns.net 检查

### 问题 3：SSL 证书错误

**原因：** 证书区域不正确
**解决：** 确保证书在 **us-east-1** 区域

### 问题 4：应用仍使用旧域名

**原因：** 代码未更新或未重新构建
**解决：**

1. 确保 `aws-config.ts` 已更新
2. 重新构建应用：`npx expo run:ios`
3. 清除缓存：`npm start -- --clear`

---

## 📚 参考资源

- [AWS Cognito 自定义域名官方文档](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-add-custom-domain.html)
- [AWS Certificate Manager 文档](https://docs.aws.amazon.com/acm/)
- [Cloudflare DNS 配置指南](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)

---

## 🔐 安全提醒

1. **保持证书有效**：SSL 证书需要定期续费
2. **监控域名到期**：确保 `thankly.app` 域名不会过期
3. **使用 HTTPS**：确保所有 OAuth 调用都使用 HTTPS

---

## 🎯 下一步

配置完成后，建议：

1. 测试所有登录流程（Apple、Google）
2. 更新应用商店截图，展示新的登录界面
3. 监控用户登录成功率
4. 考虑添加更友好的登录页面自定义样式（可选）
