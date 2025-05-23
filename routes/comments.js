const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Topic = require('../models/Topic');
const auth = require('../middleware/auth');

// 获取主题的所有评论
router.get('/topic/:topicId', async (req, res) => {
  try {
    const comments = await Comment.find({ topic: req.params.topicId })
      .populate('author', 'username avatar')
      .populate('parentComment')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建评论
router.post('/', [auth, [
  check('content', '评论内容不能为空').notEmpty(),
  check('topicId', '主题ID不能为空').notEmpty()
]], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, topicId, parentCommentId } = req.body;

    // 检查主题是否存在
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: '主题不存在' });
    }

    const comment = new Comment({
      content,
      author: req.user.id,
      topic: topicId,
      parentComment: parentCommentId
    });

    await comment.save();

    // 更新主题的最后回复时间
    topic.lastReplyAt = Date.now();
    await topic.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username avatar')
      .populate('parentComment');

    res.json(populatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新评论
router.put('/:id', [auth], async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    // 检查是否是作者
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: '没有权限修改此评论' });
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('author', 'username avatar')
      .populate('parentComment');

    res.json(updatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除评论
router.delete('/:id', [auth], async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    // 检查是否是作者或管理员
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限删除此评论' });
    }

    await comment.remove();

    res.json({ message: '评论已删除' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 点赞评论
router.post('/:id/like', [auth], async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    // 检查是否已经点赞
    if (comment.likes.includes(req.user.id)) {
      return res.status(400).json({ message: '已经点赞过了' });
    }

    comment.likes.push(req.user.id);
    await comment.save();

    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 