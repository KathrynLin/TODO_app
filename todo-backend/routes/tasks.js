const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

// 获取当前用户的所有任务
router.get('/', auth, async (req, res) => {
    const tasks = await Task.find({ userId: req.user.userId });
    res.json(tasks);
});

// 创建新任务
router.post('/', auth, async (req, res) => {
    const { title } = req.body;
    const task = new Task({ title, userId: req.user.userId });
    await task.save();
    res.status(201).json(task);
});

// 更新任务（修改标题/完成状态）
router.put('/:id', auth, async (req, res) => {
    const { title, completed } = req.body;
    const updatedTask = await Task.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.userId },
        { title, completed },
        { new: true }
    );
    res.json(updatedTask);
});

// 删除任务
router.delete('/:id', auth, async (req, res) => {
    await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    res.json({ message: "任务已删除" });
});

module.exports = router;
