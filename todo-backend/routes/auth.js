const express = require('express');
const bcrypt = require('bcryptjs');  // 用于加密密码
const User = require('../models/User');  // 引入 User 模型
const jwt = require('jsonwebtoken');

const router = express.Router();

// 用户注册 API
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 检查是否已有相同的 email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email 已被注册" });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建新用户
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({ message: "用户注册成功" });
    } catch (error) {
        res.status(500).json({ message: "服务器错误", error });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 检查用户是否存在
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "用户不存在" });
        }

        // 检查密码是否正确
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "密码错误" });
        }

        // 生成 JWT 令牌
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: "服务器错误", error });
    }
});


module.exports = router;
