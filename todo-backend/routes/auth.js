const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // check if user exists
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // create a new user
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

// login a user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // create a JWT token
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