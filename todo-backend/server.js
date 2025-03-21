const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();


app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

app.get('/', (req, res) => {
    res.send("Server is running and MongoDB is connected!");
});

app.listen(5000, () => console.log('🚀 Server running on port 5000'));

const User = require('./models/User');
const authRoutes = require('./routes/auth');  // 引入用户认证路由
app.use('/api', authRoutes);  // 注册路由

const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', taskRoutes);


