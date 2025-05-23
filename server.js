import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeWebDAV } from './config/webdav.js';

// 导入路由
import authRoutes from './routes/auth.js';
import topicRoutes from './routes/topics.js';
import commentRoutes from './routes/comments.js';
import adminRoutes from './routes/admin.js';

// 初始化环境变量
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CORS 配置
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://你的域名.com', 'https://www.你的域名.com']
        : 'http://localhost:3007',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// 中间件
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // 增加请求体大小限制，用于处理图片上传
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// 初始化 WebDAV
try {
    await initializeWebDAV();
    console.log('WebDAV 初始化成功');
} catch (error) {
    console.error('WebDAV 初始化失败:', error);
    process.exit(1);
}

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('服务器错误！');
});

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 