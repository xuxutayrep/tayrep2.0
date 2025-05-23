# Taylor Swift Club 论坛

这是一个基于 Cloudflare Workers 的 Taylor Swift 粉丝论坛项目。

## 功能特点

- 用户注册和登录
- 主题发布和管理
- 评论系统
- 点赞功能
- 响应式设计

## 技术栈

- Frontend: HTML, CSS, JavaScript
- Backend: Cloudflare Workers
- Database: Cloudflare D1 (SQLite)
- Authentication: JWT

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev:worker
```

## 部署

1. 登录到 Cloudflare：
```bash
npx wrangler login
```

2. 部署到 Cloudflare Workers：
```bash
npm run deploy
```

## 环境变量

在 Cloudflare Dashboard 中设置以下环境变量：

- `JWT_SECRET`: JWT 密钥
- `MONGODB_URI`: MongoDB 连接字符串（如果使用）

## 许可证

MIT 