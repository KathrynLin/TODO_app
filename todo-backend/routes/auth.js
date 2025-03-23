const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查邮箱是否已存在
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // 创建用户
    const user = new User({
      username,
      email,
      password: await bcrypt.hash(password, 10)
    });

    await user.save();
    res.status(201).json({ message: "User created" });
    
  } catch (error) {
    console.error("🔥 Auth Register Error:", error);  
    res.status(500).json({ error: "Server error" });
  }
  
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // 验证用户
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 生成Token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({ token });
    
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;