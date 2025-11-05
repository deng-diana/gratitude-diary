# 📚 文档目录

本项目包含详细的配置和部署文档，帮助你更好地理解和使用感恩日记应用。

## 🔐 认证配置

### AWS Cognito 自定义域名
配置自定义域名，提升用户体验和品牌一致性。

**配置文件：**
- 📖 [AWS_COGNITO_CUSTOM_DOMAIN_SETUP.md](./AWS_COGNITO_CUSTOM_DOMAIN_SETUP.md) - 完整配置指南
  - 步骤详解
  - 常见问题排查
  - 安全提醒
  - 参考资源

- ⚡ [QUICK_SETUP.md](./QUICK_SETUP.md) - 快速配置清单
  - 配置检查清单
  - 快速验证步骤

**自动化工具：**
- 🤖 [../scripts/setup-cognito-domain.sh](../scripts/setup-cognito-domain.sh) - 一键配置脚本
  - 自动创建 SSL 证书
  - 自动验证 DNS
  - 交互式配置向导

## 📖 其他文档

- [../README.md](../README.md) - 项目主文档
- [../mobile/src/i18n/GUIDE.md](../mobile/src/i18n/GUIDE.md) - 国际化配置指南

## 🎯 使用建议

**如果你是新手：**
1. 先阅读项目主 README
2. 使用 QUICK_SETUP.md 配置清单
3. 遇到问题查阅完整配置指南

**如果你是老手：**
1. 直接使用自动化脚本
2. 查阅完整指南深入了解细节

## 🔍 文档维护

本目录的文档会根据项目发展持续更新。如果你发现文档需要改进或补充，欢迎提交 Issue 或 Pull Request！

---

**最后更新：** 2024年12月

