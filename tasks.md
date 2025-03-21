### **Back-End Developer Challenge 任务大纲**
你需要完成一个**带有用户认证的待办事项应用（To-Do List App）**，这个应用需要包括**前端（React）和后端（Node.js + Express + MongoDB）**。  

由于你**从未使用过 React 和 Node.js**，我们会按照**最基础的步骤**来完成这个项目。  

---

## **第一阶段：环境搭建**
### **1. 安装 Node.js 和 npm**
Node.js 是 JavaScript 运行环境，而 npm（Node Package Manager）用于管理依赖库。  
- [下载并安装 Node.js](https://nodejs.org/)
- 安装完成后，在终端（或命令行）中输入：
  ```bash
  node -v   # 检查 Node.js 版本
  npm -v    # 检查 npm 版本
  ```

---

## **第二阶段：后端开发（Node.js + Express + MongoDB）**
后端将处理用户认证（JWT 登录系统）和待办事项管理。

### **2. 创建后端项目**
- 在你的计算机上创建一个新文件夹：
  ```bash
  mkdir todo-backend
  cd todo-backend
  ```
- 初始化 Node.js 项目：
  ```bash
  npm init -y
  ```
- 安装必要的库：
  ```bash
  npm install express mongoose cors bcryptjs jsonwebtoken dotenv
  ```

### **3. 创建 Express 服务器**
- 在 `todo-backend` 文件夹下创建 `server.js`：
  ```javascript
  const express = require('express');
  const cors = require('cors');
  const mongoose = require('mongoose');
  require('dotenv').config();

  const app = express();
  app.use(express.json());
  app.use(cors());

  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => console.log("MongoDB Connected"))
      .catch(err => console.log(err));

  app.listen(5000, () => console.log('Server running on port 5000'));
  ```

### **4. 连接 MongoDB 数据库**
- **注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) 账号**
- **创建数据库，并获取 MongoDB 连接 URI**
- **在项目中创建 `.env` 文件，添加以下内容：**
  ```
  MONGO_URI=你的MongoDB连接URI
  JWT_SECRET=your_jwt_secret
  ```

### **5. 创建用户模型**
- 在 `models/User.js` 中：
  ```javascript
  const mongoose = require('mongoose');

  const UserSchema = new mongoose.Schema({
      username: String,
      email: { type: String, unique: true },
      password: String
  });

  module.exports = mongoose.model('User', UserSchema);
  ```

### **6. 创建用户注册和登录 API**
- 在 `routes/auth.js`：
  ```javascript
  const express = require('express');
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');

  const router = express.Router();

  // 注册
  router.post('/register', async (req, res) => {
      const { username, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, email, password: hashedPassword });
      await user.save();
      res.json({ message: 'User registered' });
  });

  // 登录
  router.post('/login', async (req, res) => {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
  });

  module.exports = router;
  ```

### **7. 创建待办事项模型**
- 在 `models/Task.js`：
  ```javascript
  const mongoose = require('mongoose');

  const TaskSchema = new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      title: String,
      completed: Boolean
  });

  module.exports = mongoose.model('Task', TaskSchema);
  ```

### **8. 创建任务管理 API**
- 在 `routes/tasks.js`：
  ```javascript
  const express = require('express');
  const Task = require('../models/Task');
  const auth = require('../middleware/auth');

  const router = express.Router();

  router.get('/', auth, async (req, res) => {
      const tasks = await Task.find({ userId: req.user.userId });
      res.json(tasks);
  });

  router.post('/', auth, async (req, res) => {
      const task = new Task({ ...req.body, userId: req.user.userId });
      await task.save();
      res.json(task);
  });

  module.exports = router;
  ```

---

## **第三阶段：前端开发（React + Axios）**
### **9. 初始化 React 项目**
```bash
npx create-react-app todo-frontend
cd todo-frontend
npm install axios react-router-dom
```

### **10. 配置 React 路由**
- 在 `App.js`：
  ```jsx
  import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
  import Signup from './pages/Signup';
  import Login from './pages/Login';
  import TodoList from './pages/TodoList';

  function App() {
    return (
      <Router>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/todo" element={<TodoList />} />
        </Routes>
      </Router>
    );
  }

  export default App;
  ```

### **11. 创建用户注册和登录页面**
- 在 `Signup.js`：
  ```jsx
  import { useState } from 'react';
  import axios from 'axios';

  function Signup() {
      const [username, setUsername] = useState('');
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');

      const handleSignup = async () => {
          await axios.post('http://localhost:5000/api/register', { username, email, password });
          alert('注册成功，请登录！');
      };

      return (
          <div>
              <h2>注册</h2>
              <input type="text" placeholder="用户名" onChange={(e) => setUsername(e.target.value)} />
              <input type="email" placeholder="邮箱" onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="密码" onChange={(e) => setPassword(e.target.value)} />
              <button onClick={handleSignup}>注册</button>
          </div>
      );
  }

  export default Signup;
  ```

---

## **第四阶段：测试和部署**
### **12. 本地测试**
1. 运行后端：
   ```bash
   node server.js
   ```
2. 运行前端：
   ```bash
   npm start
   ```
3. 使用 `Postman` 或 `浏览器` 测试 API。

### **13. 部署**
- **后端**：使用 **Heroku 或 Render**
- **前端**：使用 **Vercel 或 Netlify**
- **数据库**：使用 **MongoDB Atlas**

---

## **总结**
1. **学习 Node.js 和 Express**，完成后端 API。
2. **学习 React**，完成前端 UI 和 API 交互。
3. **测试 API**，确保用户可以注册、登录、管理任务。
4. **部署应用**，完成整个项目。

你可以先尝试第一步：安装 Node.js，告诉我你的进度，我会帮你一步步推进！🚀