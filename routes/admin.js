import express from 'express';
import { check, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';
import { WebDAVClient } from '../config/webdav.js';

const router = express.Router();

// 获取统计数据
router.get('/stats', auth, async (req, res) => {
    try {
        // 检查是否是管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: '没有管理员权限' });
        }

        // 从WebDAV获取数据统计
        const webdav = await WebDAVClient();
        
        // 获取帖子数量
        const postsDir = await webdav.getDirectoryContents('/posts');
        const postsCount = postsDir.length;

        // 获取评论数量
        const commentsDir = await webdav.getDirectoryContents('/comments');
        const commentsCount = commentsDir.length;

        // 获取用户数量
        const usersDir = await webdav.getDirectoryContents('/users');
        const usersCount = usersDir.length;

        res.json({
            postsCount,
            commentsCount,
            usersCount
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    }
});

// 上传最新专辑信息
router.post('/album', [
    auth,
    check('title', '请输入专辑标题').not().isEmpty(),
    check('description', '请输入专辑描述').not().isEmpty()
], async (req, res) => {
    try {
        // 检查是否是管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: '没有管理员权限' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, coverBase64 } = req.body;

        // 将专辑信息保存到WebDAV
        const webdav = await WebDAVClient();
        const albumData = {
            title,
            description,
            coverUrl: '', // 将在保存封面后更新
            createdAt: new Date().toISOString()
        };

        // 保存封面图片
        if (coverBase64) {
            const base64Data = coverBase64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const coverPath = `/albums/covers/${Date.now()}.jpg`;
            await webdav.putFileContents(coverPath, buffer);
            albumData.coverUrl = coverPath;
        }

        // 保存专辑信息
        const albumPath = `/albums/data/${Date.now()}.json`;
        await webdav.putFileContents(albumPath, JSON.stringify(albumData));

        res.json(albumData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    }
});

// 上传官方照片
router.post('/photos', [
    auth,
    check('category', '请选择照片分类').not().isEmpty()
], async (req, res) => {
    try {
        // 检查是否是管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: '没有管理员权限' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { category, photos } = req.body;
        const webdav = await WebDAVClient();
        const uploadedPhotos = [];

        // 上传每张照片
        for (const photoBase64 of photos) {
            const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const photoPath = `/photos/${category}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            await webdav.putFileContents(photoPath, buffer);
            uploadedPhotos.push(photoPath);
        }

        res.json(uploadedPhotos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    }
});

// 获取所有用户
router.get('/users', auth, async (req, res) => {
    try {
        // 检查是否是管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: '没有管理员权限' });
        }

        const webdav = await WebDAVClient();
        const usersDir = await webdav.getDirectoryContents('/users');
        const users = [];

        for (const userFile of usersDir) {
            if (userFile.type === 'file') {
                const userData = await webdav.getFileContents(userFile.filename, { format: 'text' });
                users.push(JSON.parse(userData));
            }
        }

        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    }
});

// 删除用户
router.delete('/users/:userId', auth, async (req, res) => {
    try {
        // 检查是否是管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: '没有管理员权限' });
        }

        const webdav = await WebDAVClient();
        await webdav.deleteFile(`/users/${req.params.userId}.json`);

        res.json({ msg: '用户已删除' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    }
});

// 获取所有帖子
router.get('/posts', auth, async (req, res) => {
    try {
        // 检查是否是管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: '没有管理员权限' });
        }

        const webdav = await WebDAVClient();
        const postsDir = await webdav.getDirectoryContents('/posts');
        const posts = [];

        for (const postFile of postsDir) {
            if (postFile.type === 'file') {
                const postData = await webdav.getFileContents(postFile.filename, { format: 'text' });
                posts.push(JSON.parse(postData));
            }
        }

        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    }
});

// 删除帖子
router.delete('/posts/:postId', auth, async (req, res) => {
    try {
        // 检查是否是管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: '没有管理员权限' });
        }

        const webdav = await WebDAVClient();
        await webdav.deleteFile(`/posts/${req.params.postId}.json`);

        // 删除相关评论
        const commentsDir = await webdav.getDirectoryContents('/comments');
        for (const commentFile of commentsDir) {
            if (commentFile.type === 'file') {
                const commentData = await webdav.getFileContents(commentFile.filename, { format: 'text' });
                const comment = JSON.parse(commentData);
                if (comment.postId === req.params.postId) {
                    await webdav.deleteFile(commentFile.filename);
                }
            }
        }

        res.json({ msg: '帖子已删除' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    }
});

// 获取所有评论
router.get('/comments', auth, async (req, res) => {
    try {
        // 检查是否是管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: '没有管理员权限' });
        }

        const webdav = await WebDAVClient();
        const commentsDir = await webdav.getDirectoryContents('/comments');
        const comments = [];

        for (const commentFile of commentsDir) {
            if (commentFile.type === 'file') {
                const commentData = await webdav.getFileContents(commentFile.filename, { format: 'text' });
                comments.push(JSON.parse(commentData));
            }
        }

        res.json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    }
});

// 删除评论
router.delete('/comments/:commentId', auth, async (req, res) => {
    try {
        // 检查是否是管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: '没有管理员权限' });
        }

        const webdav = await WebDAVClient();
        await webdav.deleteFile(`/comments/${req.params.commentId}.json`);

        res.json({ msg: '评论已删除' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    }
});

// 获取最新专辑
router.get('/albums/latest', async (req, res) => {
    try {
        const webdav = await WebDAVClient();
        const albumsDir = await webdav.getDirectoryContents('/albums/data');
        
        if (albumsDir.length === 0) {
            return res.status(404).json({ msg: '没有找到专辑信息' });
        }

        // 按创建时间排序，获取最新的专辑
        const latestAlbum = await Promise.all(
            albumsDir
                .filter(file => file.type === 'file')
                .map(async file => {
                    const albumData = await webdav.getFileContents(file.filename, { format: 'text' });
                    return JSON.parse(albumData);
                })
        ).then(albums => 
            albums.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        );

        res.json(latestAlbum);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    }
});

// 获取所有照片
router.get('/photos', async (req, res) => {
    try {
        const webdav = await WebDAVClient();
        const categories = ['street', 'album', 'tour'];
        const allPhotos = [];

        for (const category of categories) {
            try {
                const photosDir = await webdav.getDirectoryContents(`/photos/${category}`);
                const categoryPhotos = photosDir
                    .filter(file => file.type === 'file')
                    .map(file => ({
                        url: file.filename,
                        category,
                        createdAt: file.lastmod
                    }));
                allPhotos.push(...categoryPhotos);
            } catch (error) {
                console.error(`获取 ${category} 类别的照片失败:`, error);
                // 继续处理其他类别
            }
        }

        // 按时间排序
        allPhotos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(allPhotos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('服务器错误');
    }
});

export default router; 