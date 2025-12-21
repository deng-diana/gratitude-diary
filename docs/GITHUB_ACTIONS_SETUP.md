# 🔧 GitHub Actions 配置指南

## 📋 快速开始

### 第一步：配置 GitHub Secrets

1. 打开你的 GitHub 仓库
2. 点击 **Settings**（设置）
3. 点击左侧 **Secrets and variables** → **Actions**
4. 点击 **New repository secret**，添加以下密钥：

#### 必需的 Secrets（后端部署）

| Secret 名称 | 说明 | 如何获取 |
|------------|------|---------|
| `AWS_ACCESS_KEY_ID` | AWS 访问密钥 ID | AWS Console → IAM → 用户 → 安全凭证 |
| `AWS_SECRET_ACCESS_KEY` | AWS 访问密钥 Secret | 同上 |
| `AWS_ACCOUNT_ID` | AWS 账户 ID | AWS Console 右上角显示 |
| `AWS_REGION` | AWS 区域 | `us-east-1`（已在工作流中配置） |

#### 可选的 Secrets（移动端构建）

| Secret 名称 | 说明 | 如何获取 |
|------------|------|---------|
| `EXPO_TOKEN` | Expo 访问令牌 | `eas login` 后，在 Expo 网站生成 |

---

### 第二步：创建 AWS IAM 用户（如果还没有）

为了安全，建议创建一个专门用于 CI/CD 的 IAM 用户：

1. **登录 AWS Console**
2. **进入 IAM 服务**
3. **创建新用户**：
   - 用户名：`github-actions-deploy`
   - 访问类型：**编程访问**（获取 Access Key）

4. **附加策略**（最小权限原则）：
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ecr:GetAuthorizationToken",
           "ecr:BatchCheckLayerAvailability",
           "ecr:GetDownloadUrlForLayer",
           "ecr:BatchGetImage",
           "ecr:PutImage",
           "ecr:InitiateLayerUpload",
           "ecr:UploadLayerPart",
           "ecr:CompleteLayerUpload",
           "lambda:UpdateFunctionCode",
           "lambda:GetFunction"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

5. **保存 Access Key ID 和 Secret Access Key**（只显示一次！）

---

### 第三步：测试部署

1. **推送代码到 GitHub**：
   ```bash
   git add .
   git commit -m "添加 GitHub Actions 自动部署"
   git push origin master
   ```

2. **查看部署状态**：
   - 打开 GitHub 仓库
   - 点击 **Actions** 标签
   - 查看最新的工作流运行

3. **如果失败，查看日志**：
   - 点击失败的工作流
   - 查看具体错误信息

---

## 🔍 工作流说明

### 后端部署工作流（`deploy-backend.yml`）

**触发条件：**
- `backend/` 目录有代码变更
- 推送到 `master` 或 `main` 分支
- 手动触发（在 Actions 页面点击 "Run workflow"）

**执行步骤：**
1. 检出代码
2. 配置 AWS 凭证
3. 登录 ECR
4. 构建 Docker 镜像
5. 推送镜像到 ECR
6. 更新 Lambda 函数
7. 等待更新完成

**预计时间：** 5-10 分钟

---

### 移动端构建工作流（`deploy-mobile.yml`）

**触发条件：**
- `mobile/` 目录有代码变更
- 手动触发（可选择 iOS/Android/两者）

**执行步骤：**
1. 检出代码
2. 安装 Node.js 和依赖
3. 运行预构建检查
4. 登录 Expo
5. 构建应用（iOS/Android）

**预计时间：** 15-30 分钟

**注意：** 移动端构建需要 Expo 账户和 EAS 配置。

---

## 🛠️ 常见问题

### Q1: 部署失败，提示 "Access Denied"

**原因：** AWS 凭证没有权限

**解决：**
1. 检查 IAM 用户权限
2. 确认 Secrets 配置正确
3. 检查 Lambda 函数名称是否正确

---

### Q2: 部署失败，提示 "ECR repository not found"

**原因：** ECR 仓库不存在

**解决：**
1. 手动运行一次 `deploy.sh` 创建仓库
2. 或在 AWS Console 手动创建 ECR 仓库

---

### Q3: 如何只部署特定目录的变更？

**修改工作流文件**：
```yaml
on:
  push:
    paths:
      - 'backend/app/**'  # 只监听 app 目录
      - 'backend/requirements.txt'  # 或特定文件
```

---

### Q4: 如何添加部署通知？

**添加 Slack/Discord 通知**：

```yaml
- name: Notify on success
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 📊 监控和日志

### 查看部署历史

1. 打开 GitHub 仓库
2. 点击 **Actions** 标签
3. 查看所有工作流运行记录

### 查看实时日志

1. 点击正在运行的工作流
2. 查看每个步骤的实时输出
3. 如果失败，查看错误信息

---

## 🔒 安全建议

1. **使用最小权限原则** - IAM 用户只给必要的权限
2. **定期轮换密钥** - 每 90 天更换一次 Access Key
3. **不要提交密钥** - 所有密钥都存储在 GitHub Secrets
4. **启用 2FA** - GitHub 账户启用双因素认证

---

## 🎯 下一步

1. ✅ 配置 GitHub Secrets
2. ✅ 测试后端部署
3. ⬜ 配置移动端构建（可选）
4. ⬜ 添加部署通知（可选）
5. ⬜ 添加测试步骤（可选）

---

**需要帮助？** 查看 GitHub Actions 文档：https://docs.github.com/en/actions

