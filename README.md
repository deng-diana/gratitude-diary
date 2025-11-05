# 🙏 感恩日记 (Gratitude Journal)

一个优雅、简洁的感恩日记应用，帮助你记录每天的美好时光。

## 📱 项目简介

这是一个使用 React Native + Expo 开发的移动端感恩日记应用，支持：

- 🍎 **Apple 登录**：使用原生 iOS 授权，体验流畅
- 🔐 **Google 登录**：通过 AWS Cognito 集成
- ✍️ 多种记录方式：文字、语音、图片
- 🎨 精美设计：双字体系统（中文用 Noto Serif SC，英文用 Lora）
- 🌍 国际化支持：中文和英文界面

## 🏗️ 技术架构

### 前端 (mobile/)
- **框架**: React Native + Expo
- **状态管理**: React Hooks
- **导航**: React Navigation
- **国际化**: i18n-js
- **认证**: Expo Apple Authentication + AWS Cognito

### 后端 (backend/)
- **框架**: FastAPI (Python)
- **认证**: AWS Cognito
- **存储**: DynamoDB (日记数据) + S3 (媒体文件)
- **部署**: AWS Lambda

## 🚀 快速开始

### 前置要求
- Node.js 18+
- Expo CLI
- iOS Simulator 或真机

### 安装和运行

```bash
# 进入 mobile 目录
cd mobile

# 安装依赖
npm install

# 启动开发服务器
npm start

# iOS 模拟器运行
npm run ios
```

## 📂 项目结构

```
gratitude-journal/
├── mobile/                 # React Native 前端应用
│   ├── src/
│   │   ├── screens/       # 页面组件
│   │   ├── components/    # 通用组件
│   │   ├── services/      # 业务逻辑（API、认证等）
│   │   ├── navigation/    # 路由配置
│   │   ├── i18n/         # 国际化配置
│   │   └── styles/       # 样式配置
│   └── app.json          # Expo 配置
├── backend/              # FastAPI 后端
│   ├── app/
│   │   ├── routers/     # API 路由
│   │   ├── services/    # 业务服务
│   │   └── models/      # 数据模型
│   └── requirements.txt # Python 依赖
└── README.md            # 项目说明

```

## 🎨 设计理念

### 字体系统
- **中文**: Noto Serif SC（思源宋体）- 优雅衬线，专为中文设计
- **英文**: Lora - 优雅衬线，与中文完美匹配
- **自动语言检测**: 根据文本内容自动选择合适字体

### 用户体验
- 简洁的界面设计
- 流畅的交互动画
- 本地化内容支持
- 无缝的认证流程

## 🔑 配置说明

### AWS 配置
编辑 `mobile/src/config/aws-config.ts`：

```typescript
export const API_BASE_URL = "your-lambda-url";
const awsConfig = {
  region: "us-east-1",
  userPoolId: "your-user-pool-id",
  userPoolWebClientId: "your-client-id",
  // ...
};
```

### 自定义域名配置
提升用户体验，使用自定义域名替代默认的 Cognito 域名：

- 📖 [完整配置指南](./docs/AWS_COGNITO_CUSTOM_DOMAIN_SETUP.md) - 详细步骤说明
- ⚡ [快速配置清单](./docs/QUICK_SETUP.md) - 配置检查清单
- 🤖 [自动化脚本](./scripts/setup-cognito-domain.sh) - 一键配置脚本

### 国际化
翻译文件位于：
- `mobile/src/i18n/zh.ts` - 中文翻译
- `mobile/src/i18n/en.ts` - 英文翻译

## 📝 待办事项

- [ ] 完善图片上传功能
- [ ] 添加日记导出功能
- [ ] 实现数据云同步
- [ ] 优化语音识别准确度
- [ ] 添加深色模式支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT License

