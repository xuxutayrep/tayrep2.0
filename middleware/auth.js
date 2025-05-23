import jwt from 'jsonwebtoken';
import { getUser } from '../config/webdav.js';

const auth = async (req, res, next) => {
  // 获取token
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: '无访问权限，请先登录' });
  }

  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找用户
    const user = await getUser(decoded.username);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    // 将用户信息添加到请求对象（不包含密码）
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (err) {
    res.status(401).json({ message: '无效的token' });
  }
};

export default auth; 