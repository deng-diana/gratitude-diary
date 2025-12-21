# ⚡ 快速部署指南

## 🎯 两种部署方式

### 方式一：手动部署（当前方式）

```bash
cd backend
./deploy.sh
```

**适用场景：**
- 快速测试
- 紧急修复
- 本地调试

---

### 方式二：自动部署（推荐）

```bash
git add .
git commit -m "更新功能"
git push origin master
```

**GitHub Actions 会自动：**
1. 检测代码变更
2. 构建 Docker 镜像
3. 部署到 AWS Lambda

**适用场景：**
- 日常开发
- 团队协作
- 生产环境

---

## 📝 配置步骤（只需一次）

### 1. 在 GitHub 添加 Secrets

**路径：** Settings → Secrets and variables → Actions

**添加以下密钥：**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCOUNT_ID` (可选，已在工作流中配置)

### 2. 测试部署

```bash
# 修改 backend/ 目录下的任意文件
echo "# test" >> backend/README.md

# 提交并推送
git add backend/README.md
git commit -m "测试自动部署"
git push origin master

# 查看部署状态
# 打开 GitHub → Actions 标签
```

---

## 🔍 如何查看部署状态

1. 打开 GitHub 仓库
2. 点击 **Actions** 标签
3. 查看最新的工作流运行
4. 点击查看详细日志

---

## ❓ 常见问题

**Q: 部署失败怎么办？**
A: 查看 Actions 日志，检查：
- AWS 凭证是否正确
- Lambda 函数名称是否正确
- ECR 仓库是否存在

**Q: 如何只部署特定文件？**
A: 修改 `.github/workflows/deploy-backend.yml` 中的 `paths` 配置

**Q: 可以手动触发部署吗？**
A: 可以！在 Actions 页面点击 "Run workflow"

---

## 📚 详细文档

- [完整部署指南](./DEPLOYMENT_GUIDE.md) - 理解 `.sh` 脚本和 CI/CD
- [GitHub Actions 配置](./GITHUB_ACTIONS_SETUP.md) - 详细配置步骤

