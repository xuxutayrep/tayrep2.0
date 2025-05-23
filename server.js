require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// 导入路由
const authRoutes = require('./routes/auth');
const topicRoutes = require('./routes/topics');
const commentRoutes = require('./routes/comments');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taylor-forum')
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/comments', commentRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 