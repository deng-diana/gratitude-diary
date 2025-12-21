# 🚀 部署指南：从手动到自动化

## 📚 第一部分：理解 `.sh` 脚本文件

### 什么是 `.sh` 文件？

`.sh` 是 **Shell 脚本**（Shell Script）的扩展名，就像：
- Windows 的 `.bat` 批处理文件
- 一个可以自动执行多个命令的"程序"

### 为什么需要 `.sh` 脚本？

**想象一下：**
- 每次部署需要执行 7 个步骤
- 手动执行容易出错、忘记步骤
- 脚本可以：**一键执行所有步骤**，不会出错

### `deploy.sh` 的工作原理

你的 `deploy.sh` 做了 7 件事：

```bash
步骤1: 检查工具（Docker、AWS CLI）
  ↓
步骤2: 登录到 AWS ECR（Docker 镜像仓库）
  ↓
步骤3: 创建/检查 ECR 仓库
  ↓
步骤4: 构建 Docker 镜像（把你的代码打包成镜像）
  ↓
步骤5: 给镜像打标签（起个名字）
  ↓
步骤6: 推送镜像到 ECR（上传到云端）
  ↓
步骤7: 更新 Lambda 函数（告诉 Lambda 用新镜像）
```

**底层原理：**
1. `#!/bin/bash` - 告诉系统用 bash 解释器运行
2. `set -e` - 遇到错误立即停止（防止继续执行错误操作）
3. `set -x` - 显示每一步执行的命令（方便调试）
4. 每个步骤都是 AWS CLI 或 Docker 命令

---

## 📚 第二部分：Git 和 GitHub 推送

### 当前工作流程（手动）

```bash
# 1. 修改代码
# 2. 提交到 Git
git add .
git commit -m "更新功能"
git push origin master

# 3. 手动运行部署脚本
cd backend
./deploy.sh
```

### 问题：容易忘记部署

- ✅ 代码推送到 GitHub 了
- ❌ 但忘记运行 `deploy.sh`
- ❌ 服务器还是旧代码

---

## 📚 第三部分：CI/CD 和 GitHub Actions

### 什么是 CI/CD？

**CI (Continuous Integration) - 持续集成**
- 每次推送代码，自动测试
- 确保代码没问题

**CD (Continuous Deployment) - 持续部署**
- 测试通过后，自动部署
- 不需要手动运行 `deploy.sh`

### 什么是 GitHub Actions？

GitHub 提供的**免费自动化工具**，可以：
- 监听你的代码推送
- 自动运行测试
- 自动运行部署脚本

**就像雇佣了一个机器人：**
```
你推送代码 → 机器人看到 → 机器人运行 deploy.sh → 自动部署完成
```

---

## 📚 第四部分：是否需要 GitHub Actions？

### ✅ 建议使用 GitHub Actions，因为：

1. **自动化** - 推送代码后自动部署，不会忘记
2. **可追溯** - 每次部署都有记录，知道谁、什么时候部署的
3. **安全** - 密钥存储在 GitHub Secrets，不会泄露
4. **免费** - GitHub Actions 有免费额度（足够个人项目使用）

### ❌ 不需要的情况：

- 项目很小，很少更新
- 只有你一个人开发
- 不介意手动部署

**对于你的项目（已上架 App Store）：建议使用！**

---

## 📚 第五部分：如何配置 GitHub Actions

### 步骤 1: 在 GitHub 配置密钥

1. 打开 GitHub 仓库
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 添加以下密钥：

```
AWS_ACCESS_KEY_ID      # AWS 访问密钥 ID
AWS_SECRET_ACCESS_KEY  # AWS 访问密钥 Secret
AWS_REGION            # us-east-1
AWS_ACCOUNT_ID        # 633404778395
ECR_REPO_NAME         # gratitude-diary
LAMBDA_FUNCTION_NAME  # gratitude-diary-api
```

### 步骤 2: GitHub Actions 工作流文件

我已经为你创建了 `.github/workflows/deploy-backend.yml`，它会：
- 监听 `backend/` 目录的代码变更
- 自动构建 Docker 镜像
- 自动推送到 ECR
- 自动更新 Lambda 函数

### 步骤 3: 使用方式

**以后部署只需要：**
```bash
git add .
git commit -m "更新功能"
git push origin master
```

**GitHub Actions 会自动：**
1. 检测到代码推送
2. 运行部署流程
3. 部署完成后发送通知（可选）

---

## 📚 第六部分：工作流程对比

### 旧流程（手动）
```
修改代码 → git push → 手动运行 deploy.sh → 部署完成
```

### 新流程（自动化）
```
修改代码 → git push → GitHub Actions 自动运行 deploy.sh → 部署完成
```

**优势：**
- ✅ 不会忘记部署
- ✅ 部署过程可追溯
- ✅ 多人协作更方便
- ✅ 可以添加测试步骤

---

## 📚 第七部分：其他 `.sh` 脚本说明

你的项目里还有其他 `.sh` 脚本：

1. **`deploy.sh`** - 部署到 Lambda（主要部署脚本）
2. **`start-local.sh`** - 本地启动后端服务器
3. **`fix-env-file.sh`** - 修复环境变量文件
4. **`create-lambda-fixed.sh`** - 创建 Lambda 函数
5. **`setup-cognito-domain.sh`** - 配置 Cognito 域名

**它们都是辅助脚本，让重复操作自动化。**

---

## 🎯 总结

1. **`.sh` 文件** = Shell 脚本，用于自动化执行命令
2. **`deploy.sh`** = 你的部署脚本，把代码部署到 AWS Lambda
3. **GitHub Actions** = 自动化工具，推送代码后自动运行部署
4. **建议使用** = 让部署更简单、更可靠

**下一步：**
- 配置 GitHub Secrets
- 使用我创建的 GitHub Actions 工作流
- 享受自动化部署的便利！

