# ⚡ AWS Cognito 自定义域名快速配置

## 📝 配置清单

使用这个清单，一步步完成配置：

### □ 第一步：AWS Certificate Manager 创建证书

1. [ ] 登录 AWS 控制台
2. [ ] 选择区域：**美国东部（弗吉尼亚北部）us-east-1**
3. [ ] 搜索 "Certificate Manager"
4. [ ] 点击 "请求证书"
5. [ ] 域名填写：`auth.thankly.app`
6. [ ] 验证方式：DNS 验证
7. [ ] 在你的 DNS 提供商添加 CNAME 记录
8. [ ] 等待证书验证完成 ✅

---

### □ 第二步：Cognito 配置自定义域名

1. [ ] AWS 控制台搜索 "Cognito"
2. [ ] 选择用户池：`us-east-1_1DgDNffb0`
3. [ ] 左侧菜单：应用程序集成 → 域名
4. [ ] 点击 "添加自定义域"
5. [ ] 子域名前缀：`auth`
6. [ ] ACM 证书：选择第一步创建的证书
7. [ ] 点击 "创建自定义域"
8. [ ] 等待状态变为 "已激活" ✅

---

### □ 第三步：DNS 配置

1. [ ] 在 Cognito 域名设置中复制 CloudFront 域名
2. [ ] 访问你的 DNS 提供商（Cloudflare/GoDaddy等）
3. [ ] 添加 CNAME 记录：
   - 类型：CNAME
   - 名称：auth
   - 目标：[从 Cognito 复制的 CloudFront 域名]
4. [ ] 保存并等待 DNS 传播完成 ✅

---

### □ 第四步：更新应用代码

```bash
# 编辑配置文件
code mobile/src/config/aws-config.ts
```

修改这一行：
```typescript
// 从：
domain: "us-east-11dgdnffb0.auth.us-east-1.amazoncognito.com",

// 改为：
domain: "auth.thankly.app",
```

保存文件 ✅

---

### □ 第五步：测试验证

1. [ ] 浏览器访问：`https://auth.thankly.app`
2. [ ] 确认看到 Cognito 登录页面
3. [ ] 确认浏览器显示绿色锁定图标（SSL 有效）
4. [ ] 重新构建应用：`npm run ios`
5. [ ] 测试 Google 登录
6. [ ] 确认登录页面显示 `auth.thankly.app` ✅

---

## 🎉 完成！

配置完成后，用户将看到友好的域名，而不是一串混乱的字符。

## 📞 需要帮助？

如果遇到问题，请参考：
- [完整配置指南](./AWS_COGNITO_CUSTOM_DOMAIN_SETUP.md)
- AWS Cognito 文档
- 或联系技术支持

