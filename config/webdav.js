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
        // 基础目录
        const directories = [
            '/',           // 根目录
            '/users',
            '/posts',
            '/comments',
            '/albums',
            '/albums/data',
            '/albums/covers',
            '/photos',
            '/photos/street',
            '/photos/album',
            '/photos/tour'
        ];

        // 按照层级顺序创建目录
        for (const dir of directories) {
            try {
                if (!await webdavClient.exists(dir)) {
                    await webdavClient.createDirectory(dir);
                    console.log(`Created directory: ${dir}`);
                } else {
                    console.log(`Directory already exists: ${dir}`);
                }
            } catch (error) {
                // 如果是根目录，忽略错误（因为它可能已经存在）
                if (dir !== '/') {
                    console.error(`Error creating directory ${dir}:`, error.message);
                }
                continue;
            }
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

// WebDAV 客户端导出
const WebDAVClient = async () => {
    return webdavClient;
};

export {
    initializeWebDAV,
    WebDAVClient,
    saveUser,
    getUser,
    savePost,
    getPost,
    getAllPosts,
    saveComment,
    getPostComments
}; 