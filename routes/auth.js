import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { saveUser, getUser } from '../config/webdav.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// 注册路由
router.post('/register', [
    body('username').trim().isLength({ min: 3 }).withMessage('用户名至少需要3个字符'),
    body('password').isLength({ min: 6 }).withMessage('密码至少需要6个字符'),
    body('isAdmin').optional().isBoolean()
], async (req, res) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password, adminCode } = req.body;

        // 检查用户是否已存在
        const existingUser = await getUser(username);
        if (existingUser) {
            return res.status(400).json({ message: '用户名已存在' });
        }

        // 检查是否是管理员注册
        let role = 'user';
        if (adminCode === process.env.ADMIN_SECRET) {
            role = 'admin';
        }

        // 加密密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 创建新用户
        const newUser = {
            username,
            password: hashedPassword,
            role,
            createdAt: Date.now()
        };

        // 保存用户
        await saveUser(newUser);

        res.status(201).json({ message: '注册成功' });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 登录路由
router.post('/login', [
    body('username').trim().notEmpty().withMessage('请输入用户名'),
    body('password').notEmpty().withMessage('请输入密码')
], async (req, res) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        // 获取用户
        const user = await getUser(username);
        if (!user) {
            return res.status(400).json({ message: '用户名或密码错误' });
        }

        // 验证密码
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: '用户名或密码错误' });
        }

        // 创建 JWT
        const token = jwt.sign(
            { username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            username: user.username,
            role: user.role
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

export default router; 