import { createClient } from 'webdav';
import dotenv from 'dotenv';

dotenv.config();

const webdavClient = createClient(process.env.WEBDAV_URL, {
    username: process.env.WEBDAV_USERNAME,
    password: process.env.WEBDAV_PASSWORD
});

// 确保必要的目录存在
async function initializeWebDAV() {
    try {
        // 创建用户目录
        if (!await webdavClient.exists('/users')) {
            await webdavClient.createDirectory('/users');
        }
        // 创建帖子目录
        if (!await webdavClient.exists('/posts')) {
            await webdavClient.createDirectory('/posts');
        }
        // 创建评论目录
        if (!await webdavClient.exists('/comments')) {
            await webdavClient.createDirectory('/comments');
        }
        console.log('WebDAV directories initialized successfully');
    } catch (error) {
        console.error('Error initializing WebDAV directories:', error);
        throw error;
    }
}

// 用户相关操作
async function saveUser(userData) {
    const userPath = `/users/${userData.username}.json`;
    await webdavClient.putFileContents(userPath, JSON.stringify(userData), { overwrite: true });
    return userData;
}

async function getUser(username) {
    const userPath = `/users/${username}.json`;
    try {
        const content = await webdavClient.getFileContents(userPath, { format: 'text' });
        return JSON.parse(content);
    } catch (error) {
        if (error.status === 404) {
            return null;
        }
        throw error;
    }
}

// 帖子相关操作
async function savePost(postData) {
    const postPath = `/posts/${postData.id}.json`;
    await webdavClient.putFileContents(postPath, JSON.stringify(postData), { overwrite: true });
    return postData;
}

async function getPost(postId) {
    const postPath = `/posts/${postId}.json`;
    try {
        const content = await webdavClient.getFileContents(postPath, { format: 'text' });
        return JSON.parse(content);
    } catch (error) {
        if (error.status === 404) {
            return null;
        }
        throw error;
    }
}

async function getAllPosts() {
    const posts = [];
    const files = await webdavClient.getDirectoryContents('/posts');
    for (const file of files) {
        if (file.type === 'file' && file.basename.endsWith('.json')) {
            const content = await webdavClient.getFileContents(file.filename, { format: 'text' });
            posts.push(JSON.parse(content));
        }
    }
    return posts.sort((a, b) => b.createdAt - a.createdAt);
}

// 评论相关操作
async function saveComment(commentData) {
    const commentPath = `/comments/${commentData.id}.json`;
    await webdavClient.putFileContents(commentPath, JSON.stringify(commentData), { overwrite: true });
    return commentData;
}

async function getPostComments(postId) {
    const comments = [];
    const files = await webdavClient.getDirectoryContents('/comments');
    for (const file of files) {
        if (file.type === 'file' && file.basename.endsWith('.json')) {
            const content = await webdavClient.getFileContents(file.filename, { format: 'text' });
            const comment = JSON.parse(content);
            if (comment.postId === postId) {
                comments.push(comment);
            }
        }
    }
    return comments.sort((a, b) => a.createdAt - b.createdAt);
}

export {
    initializeWebDAV,
    saveUser,
    getUser,
    savePost,
    getPost,
    getAllPosts,
    saveComment,
    getPostComments
}; 