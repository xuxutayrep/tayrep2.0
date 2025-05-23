const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 10
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['音乐讨论', '演唱会', '周边收藏', '其他'],
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isSticky: {
    type: Boolean,
    default: false
  },
  isHighlight: {
    type: Boolean,
    default: false
  },
  lastReplyAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 添加全文搜索索引
topicSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Topic', topicSchema); 