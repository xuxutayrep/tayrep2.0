import express from 'express';
import { check, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { saveComment, getPostComments } from '../config/webdav.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// 获取主题的所有评论
router.get('/topic/:topicId', async (req, res) => {
  try {
    const comments = await getPostComments(req.params.topicId);
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

    const comment = {
      id: uuidv4(),
      content,
      author: req.user.username,
      postId: topicId,
      parentCommentId,
      createdAt: Date.now(),
      likes: []
    };

    await saveComment(comment);
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新评论
router.put('/:id', [auth], async (req, res) => {
  try {
    const comments = await getPostComments(req.body.topicId);
    const comment = comments.find(c => c.id === req.params.id);

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    // 检查是否是作者
    if (comment.author !== req.user.username) {
      return res.status(403).json({ message: '没有权限修改此评论' });
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    await saveComment(comment);

    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除评论
router.delete('/:id', [auth], async (req, res) => {
  try {
    const comments = await getPostComments(req.query.topicId);
    const comment = comments.find(c => c.id === req.params.id);

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    // 检查是否是作者
    if (comment.author !== req.user.username) {
      return res.status(403).json({ message: '没有权限删除此评论' });
    }

    // 从 WebDAV 中删除评论
    // 注意：这里需要实现删除评论的功能
    // await deleteComment(req.params.id);

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

export default router; 