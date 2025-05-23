const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Topic = require('../models/Topic');
const auth = require('../middleware/auth');

// 获取所有主题
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const topics = await Topic.find()
      .populate('author', 'username avatar')
      .sort({ isSticky: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Topic.countDocuments();

    res.json({
      topics,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新主题
router.post('/', [auth, [
  check('title', '标题不能为空').notEmpty(),
  check('content', '内容至少需要10个字符').isLength({ min: 10 }),
  check('category', '请选择有效的分类').isIn(['音乐讨论', '演唱会', '周边收藏', '其他'])
]], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, category, tags } = req.body;

    const topic = new Topic({
      title,
      content,
      category,
      tags: tags || [],
      author: req.user.id
    });

    await topic.save();

    const populatedTopic = await Topic.findById(topic._id)
      .populate('author', 'username avatar');

    res.json(populatedTopic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个主题
router.get('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('author', 'username avatar');

    if (!topic) {
      return res.status(404).json({ message: '主题不存在' });
    }

    // 增加浏览量
    topic.views += 1;
    await topic.save();

    res.json(topic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新主题
router.put('/:id', [auth], async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ message: '主题不存在' });
    }

    // 检查是否是作者
    if (topic.author.toString() !== req.user.id) {
      return res.status(403).json({ message: '没有权限修改此主题' });
    }

    const { title, content, category, tags } = req.body;

    if (title) topic.title = title;
    if (content) topic.content = content;
    if (category) topic.category = category;
    if (tags) topic.tags = tags;

    await topic.save();

    const updatedTopic = await Topic.findById(topic._id)
      .populate('author', 'username avatar');

    res.json(updatedTopic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除主题
router.delete('/:id', [auth], async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ message: '主题不存在' });
    }

    // 检查是否是作者或管理员
    if (topic.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限删除此主题' });
    }

    await topic.remove();

    res.json({ message: '主题已删除' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 点赞主题
router.post('/:id/like', [auth], async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ message: '主题不存在' });
    }

    // 检查是否已经点赞
    if (topic.likes.includes(req.user.id)) {
      return res.status(400).json({ message: '已经点赞过了' });
    }

    topic.likes.push(req.user.id);
    await topic.save();

    res.json(topic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 