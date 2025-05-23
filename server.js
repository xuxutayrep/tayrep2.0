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

// 初始化环境变量
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 中间件
app.use(cors());
app.use(express.json());
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

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: '服务器内部错误' });
});

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 