const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');



const taskValidationRules = [
  body('title')
    .trim()
    .isLength({ min: 3 })
    .withMessage('The title should be at least 3 characters long'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('The description cannot exceed 500 characters'),
  body('category')
    .isIn(['work', 'personal', 'shopping'])
    .withMessage('Invalid task classification'),
  body('priority')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid task priority'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format (ISO8601 format required)'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('The completion status must be Boolean')
];

// get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const {
      category,
      priority,
      completed,
      search,
      sortBy = 'dueDate',
      page = 1,
      limit = 10,
      dueDate_gte,
      dueDate_lte
    } = req.query;

    const matchStage = { userId: new mongoose.Types.ObjectId(req.user.userId) };
    if (category) matchStage.category = category;
    if (priority) matchStage.priority = priority;
    if (completed !== undefined) {
      matchStage.completed = completed === 'true';
    } else {
      matchStage.completed = false;
    }
    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (dueDate_gte && dueDate_lte) {
      matchStage.dueDate = {
        $gte: new Date(dueDate_gte),
        $lte: new Date(dueDate_lte)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          priorityValue: {
            $switch: {
              branches: [
                { case: { $eq: ["$priority", "high"] }, then: 3 },
                { case: { $eq: ["$priority", "medium"] }, then: 2 },
                { case: { $eq: ["$priority", "low"] }, then: 1 }
              ],
              default: 0
            }
          },
          hasDueDate: {
            $cond: [{ $ifNull: ["$dueDate", false] }, 1, 0]
          }
        }
      }
    ];

    if (sortBy === 'priority') {
      pipeline.push({ $sort: { completed: 1, priorityValue: -1, createdAt: -1 } });
    } else if (sortBy === 'createdAt') {
      pipeline.push({ $sort: { completed: 1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { completed: 1, hasDueDate: -1, dueDate: 1 } });
    }

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const tasks = await Task.aggregate(pipeline);
    const total = await Task.countDocuments(matchStage);

    res.json({
      data: tasks,
      pagination: {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('🔥 Fetch Tasks Error:', error);
    res.status(500).json({
      code: 'FETCH_TASKS_FAILED',
      message: '获取任务失败'
    });
  }
});

// get task status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId
      },
      {
        completed: req.body.completed
      },
      {
        new: true
      }
    );

    if (!task) {
      return res.status(404).json({ code: 'TASK_NOT_FOUND', message: '任务不存在' });
    }

    res.json({ code: 'TASK_STATUS_UPDATED', data: task });
  } catch (error) {
    res.status(500).json({ code: 'UPDATE_STATUS_FAILED', message: '更新状态失败' });
  }
});

// Create a new task (with data validation)
router.post('/', auth, taskValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      code: 'VALIDATION_ERROR',
      errors: errors.array() 
    });
  }

  try {
    const taskData = {
      ...req.body,
      userId: req.user.userId
    };

    if (!taskData.category) taskData.category = 'personal';
    if (!taskData.priority) taskData.priority = 'medium';

    const task = await Task.create(taskData);

    res.status(201).json({
      code: 'TASK_CREATED',
      data: task
    });

  } catch (error) {
    console.error('🔥 Task creation error:', error);
    res.status(500).json({
      code: 'CREATE_TASK_FAILED',
      message: '创建任务失败'
    });
  }
});

// Update task (full field validation)
router.put('/:id', auth, taskValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      code: 'VALIDATION_ERROR',
      errors: errors.array() 
    });
  }

  try {
    const task = await Task.findOneAndUpdate(
      { 
        _id: req.params.id, 
        userId: req.user.userId 
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        code: 'TASK_NOT_FOUND',
        message: '任务不存在或没有权限'
      });
    }

    res.json({ code: 'TASK_UPDATED', data: task });

  } catch (error) {
    res.status(500).json({ code: 'UPDATE_TASK_FAILED', message: '更新任务失败' });
  }
});

// delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!task) {
      return res.status(404).json({ code: 'TASK_NOT_FOUND', message: '任务不存在或已删除' });
    }

    res.json({ code: 'TASK_DELETED', data: task });

  } catch (error) {
    res.status(500).json({ code: 'DELETE_TASK_FAILED', message: '删除任务失败' });
  }
});


router.get('/all', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId });
    res.json({ code: 'TASKS_ALL_SUCCESS', data: tasks });
  } catch (err) {
    console.error('🔥 Fetch all tasks error:', err);
    res.status(500).json({ code: 'FETCH_ALL_FAILED', message: '加载全部任务失败' });
  }
});
// bulk delete tasks
router.delete('/bulk/delete', auth, async (req, res) => {
  try {
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ code: 'INVALID_REQUEST', message: '需要提供有效的任务ID数组' });
    }

    const result = await Task.deleteMany({
      _id: { $in: taskIds },
      userId: req.user.userId
    });

    res.json({ code: 'BULK_DELETE_SUCCESS', data: { deletedCount: result.deletedCount } });

  } catch (error) {
    res.status(500).json({ code: 'BULK_DELETE_FAILED', message: '批量删除失败' });
  }
});

module.exports = router;